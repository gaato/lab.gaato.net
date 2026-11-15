import { describe, expect, it } from 'vitest';

import { demuxMp4 } from './mp4-demux';
import { muxMp4, type EncodedSample } from './mp4-mux';

function samples(
	prefix: number,
	count: number,
	durationUs: number
): EncodedSample[] {
	return Array.from({ length: count }, (_, index) => ({
		data: Uint8Array.of(prefix, index, index + 1),
		timestampUs: index * durationUs,
		durationUs,
		keyframe: index % 2 === 0
	}));
}

describe('MP4 muxer', () => {
	it('round-trips AVC/AAC metadata, samples, timestamps, sync flags, and rotation', async () => {
		const videoSamples = samples(0xa0, 4, 33333);
		videoSamples[1].timestampUs = 66666;
		videoSamples[2].timestampUs = 33333;
		videoSamples.forEach((sample, index) => {
			sample.decodeTimestampUs = index * 33333;
		});
		const audioSamples = samples(0xb0, 6, 21333);
		const bytes = muxMp4({
			video: {
				sampleEntry: 'avc1',
				description: Uint8Array.of(1, 0x64, 0, 0x1f, 0xff),
				width: 640,
				height: 360,
				rotation: 90,
				samples: videoSamples
			},
			audio: {
				sampleEntry: 'mp4a',
				description: Uint8Array.of(0x12, 0x10),
				channelCount: 2,
				sampleRate: 44100,
				samples: audioSamples
			}
		});
		const source = {
			size: bytes.length,
			read: async (offset: number, length: number) =>
				bytes.slice(offset, offset + length)
		};
		const result = await demuxMp4(source);
		const video = result.tracks.find((track) => track.kind === 'video');
		const audio = result.tracks.find((track) => track.kind === 'audio');
		expect(video).toMatchObject({
			codec: 'avc1.64001F',
			width: 640,
			height: 360,
			rotation: 90
		});
		expect(video?.samples.map((sample) => sample.keyframe)).toEqual([
			true,
			false,
			true,
			false
		]);
		expect(video?.samples.some((sample) => sample.pts !== sample.dts)).toBe(
			true
		);
		expect(video?.samples.map((sample) => sample.ptsUs)).toEqual(
			videoSamples
				.map(
					(sample) =>
						(Math.round((sample.timestampUs / 1_000_000) * 90000) / 90000) *
						1_000_000
				)
				.map(Math.round)
		);
		expect(audio).toMatchObject({
			codec: 'mp4a.40.2',
			sampleRate: 44100,
			channelCount: 2
		});
		if (!video || !audio) throw new Error('round-trip lost a track');
		for (let index = 0; index < videoSamples.length; index += 1)
			expect(await result.readSample(video, index)).toEqual(
				videoSamples[index].data
			);
		for (let index = 0; index < audioSamples.length; index += 1)
			expect(await result.readSample(audio, index)).toEqual(
				audioSamples[index].data
			);
	});

	it('uses timestamp gaps for jittered samples without composition offsets or rounding drift', async () => {
		const timestamps = [0, 37300, 66700, 104000, 133333, 170667];
		const videoSamples = samples(0xa0, timestamps.length, 33333).map(
			(sample, index) => ({
				...sample,
				timestampUs: timestamps[index] + 1_000_000
			})
		);
		const bytes = muxMp4({
			video: {
				sampleEntry: 'avc1',
				description: Uint8Array.of(1, 0x64, 0, 0x1f, 0xff),
				width: 320,
				height: 240,
				samples: videoSamples
			}
		});
		expect(new TextDecoder('latin1').decode(bytes)).not.toContain('ctts');
		const result = await demuxMp4({
			size: bytes.length,
			read: async (offset, length) => bytes.slice(offset, offset + length)
		});
		const track = result.tracks[0];
		const ticks = timestamps.map((timestamp) =>
			Math.round((timestamp * 90000) / 1_000_000)
		);
		expect(track.samples.map((sample) => sample.dts)).toEqual(ticks);
		expect(track.samples.map((sample) => sample.pts)).toEqual(ticks);
		expect(track.samples.map((sample) => sample.duration)).toEqual(
			ticks.map((timestamp, index) =>
				index + 1 < ticks.length
					? ticks[index + 1] - timestamp
					: Math.round((33333 * 90000) / 1_000_000)
			)
		);
		expect(
			track.samples
				.slice(0, -1)
				.reduce((sum, sample) => sum + sample.duration, 0)
		).toBe(ticks.at(-1));
	});

	it('round-trips Opus description through dOps', async () => {
		const head = new Uint8Array(19);
		head.set(new TextEncoder().encode('OpusHead'));
		head.set([1, 2, 0x38, 0x01, 0x80, 0xbb, 0, 0, 0, 0, 0], 8);
		const bytes = muxMp4({
			audio: {
				sampleEntry: 'Opus',
				description: head,
				channelCount: 2,
				sampleRate: 48000,
				samples: samples(1, 2, 20000)
			}
		});
		const result = await demuxMp4({
			size: bytes.length,
			read: async (offset, length) => bytes.slice(offset, offset + length)
		});
		expect(result.tracks[0]).toMatchObject({
			codec: 'opus',
			channelCount: 2,
			sampleRate: 48000,
			description: head
		});
	});
});
