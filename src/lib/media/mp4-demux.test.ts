import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { demuxMp4, MediaError, type RandomAccessSource } from './mp4-demux';

const fixtureDirectory = fileURLToPath(new URL('./fixtures/', import.meta.url));

async function fixtureSource(name: string): Promise<RandomAccessSource> {
	const bytes = await readFile(`${fixtureDirectory}${name}`);
	return {
		size: bytes.length,
		async read(offset, length) {
			return new Uint8Array(
				bytes.buffer,
				bytes.byteOffset + offset,
				length
			).slice();
		}
	};
}

describe('MP4 demuxer', () => {
	it('reads jittered VFR presentation times and the exact fractional duration', async () => {
		const result = await demuxMp4(await fixtureSource('vfr-jitter.mp4'));
		expect(result.durationUs).toBe(2_499_989);
		expect(result.tracks).toHaveLength(1);
		const video = result.tracks[0];
		expect(video).toMatchObject({ kind: 'video', width: 320, height: 240 });
		expect(video.samples).toHaveLength(75);
		const timestamps = video.samples
			.map((sample) => sample.ptsUs)
			.sort((a, b) => a - b);
		expect(timestamps.slice(0, 4)).toEqual([0, 37322, 66667, 104000]);
		expect(
			new Set(video.samples.map((sample) => sample.durationUs)).size
		).toBeGreaterThan(1);
	});
	it('reads H.264, AAC, B-frame timestamps, and sample bytes', async () => {
		const result = await demuxMp4(await fixtureSource('h264-aac.mp4'));
		const video = result.tracks.find((track) => track.kind === 'video');
		const audio = result.tracks.find((track) => track.kind === 'audio');
		expect(result.durationUs).toBe(2_000_000);
		expect(video).toMatchObject({
			codec: 'avc1.64000D',
			width: 320,
			height: 240,
			rotation: 0
		});
		expect(video?.samples).toHaveLength(60);
		expect(video?.samples.some((sample) => sample.pts !== sample.dts)).toBe(
			true
		);
		if (!video) throw new Error('fixture has no video track');
		expect(await result.readSample(video, 0)).toHaveLength(
			video.samples[0].size
		);
		expect(audio).toMatchObject({
			codec: 'mp4a.40.2',
			sampleRate: 44100,
			channelCount: 2
		});
		expect(audio?.samples).toHaveLength(88);
	});

	it('reads QuickTime rotation and its nested AAC description', async () => {
		const result = await demuxMp4(await fixtureSource('hevc-rotated.mov'));
		expect(result.tracks.find((track) => track.kind === 'video')).toMatchObject(
			{
				codec: expect.stringMatching(/^hvc1\./u),
				width: 320,
				height: 240,
				rotation: 90
			}
		);
		expect(result.tracks.find((track) => track.kind === 'audio')).toMatchObject(
			{
				codec: 'mp4a.40.2',
				sampleRate: 48000,
				channelCount: 1
			}
		);
	});

	it('rejects fragmented and EBML containers with typed errors', async () => {
		await expect(
			demuxMp4(await fixtureSource('fragmented.mp4'))
		).rejects.toMatchObject({
			code: 'fragmented_unsupported'
		});
		const ebml = Uint8Array.of(0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0);
		await expect(
			demuxMp4({
				size: ebml.length,
				read: async (offset, length) => ebml.slice(offset, offset + length)
			})
		).rejects.toEqual(expect.any(MediaError));
	});
});
