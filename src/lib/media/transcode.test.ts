import { readFile } from 'node:fs/promises';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { blobSource, demuxMp4 } from './mp4-demux';
import { inspectVideo, transcodeVideo } from './transcode';

afterEach(() => vi.unstubAllGlobals());

async function fixture(name: string): Promise<Blob> {
	return new Blob([
		await readFile(new URL(`./fixtures/${name}`, import.meta.url))
	]);
}

// Exercise demux -> selection -> codec callbacks -> mux without a browser codec.
// The fake decoder reorders presentation output just as WebCodecs does.
function installVideoCodecs(): void {
	vi.stubGlobal(
		'OffscreenCanvas',
		class {
			getContext() {
				return { drawImage() {} };
			}
		}
	);
	vi.stubGlobal(
		'VideoFrame',
		class {
			timestamp: number;
			duration: number;
			constructor(_canvas: unknown, init: VideoFrameInit) {
				this.timestamp = init.timestamp!;
				this.duration = init.duration!;
			}
			close() {}
		}
	);
	vi.stubGlobal(
		'EncodedVideoChunk',
		class {
			constructor(init: EncodedVideoChunkInit) {
				Object.assign(this, init);
			}
		}
	);
	vi.stubGlobal(
		'VideoDecoder',
		class {
			static async isConfigSupported() {
				return { supported: true };
			}
			decodeQueueSize = 0;
			chunks: EncodedVideoChunk[] = [];
			constructor(readonly callbacks: VideoDecoderInit) {}
			configure() {}
			decode(chunk: EncodedVideoChunk) {
				this.chunks.push(chunk);
			}
			async flush() {
				for (const chunk of this.chunks.sort(
					(a, b) => a.timestamp - b.timestamp
				))
					this.callbacks.output({
						timestamp: chunk.timestamp,
						close() {}
					} as VideoFrame);
			}
			close() {}
		}
	);
	vi.stubGlobal(
		'VideoEncoder',
		class {
			static async isConfigSupported() {
				return { supported: true };
			}
			encodeQueueSize = 0;
			constructor(readonly callbacks: VideoEncoderInit) {}
			configure() {}
			encode(frame: VideoFrame, options: VideoEncoderEncodeOptions) {
				this.callbacks.output(
					{
						byteLength: 1,
						timestamp: frame.timestamp,
						duration: frame.duration,
						type: options.keyFrame ? 'key' : 'delta',
						copyTo(target: Uint8Array) {
							target[0] = 1;
						}
					} as EncodedVideoChunk,
					{
						decoderConfig: {
							codec: 'avc1.64001F',
							description: Uint8Array.of(1, 0x64, 0, 0x1f, 0xff)
						}
					}
				);
			}
			async flush() {}
			close() {}
		}
	);
}

describe('transcoding', () => {
	it('estimates source video bitrate independently of audio', async () => {
		const file = await fixture('h264-aac.mp4');
		const info = await inspectVideo(file);
		expect(info.video.bitrate).toBeGreaterThan(0);
		expect(info.audio?.bitrate).toBeGreaterThan(0);
		expect(info.video.bitrate + info.audio!.bitrate).toBeLessThan(
			(file.size * 8) / 2
		);
	});

	it('keeps all jittered VFR frames and reports progress against the trimmed selection', async () => {
		installVideoCodecs();
		const file = await fixture('vfr-jitter.mp4');
		const source = await demuxMp4(blobSource(file));
		const start = 1_000_000;
		const end = 1_500_000;
		const wanted = source.tracks[0].samples
			.filter((sample) => sample.ptsUs >= start && sample.ptsUs < end)
			.sort((a, b) => a.ptsUs - b.ptsUs);
		const progress: number[] = [];
		const result = await transcodeVideo(file, {
			targetBytes: 5 * 1024 * 1024,
			trimStartUs: start,
			trimEndUs: end,
			keepAudio: false,
			aacEncodeSupported: false,
			onProgress(phase, fraction) {
				if (phase === 'encode') progress.push(fraction);
			}
		});
		const output = await demuxMp4(
			blobSource(new Blob([result.mp4.slice().buffer]))
		);
		expect(output.tracks[0].samples).toHaveLength(wanted.length);
		expect(output.tracks[0].samples.map((sample) => sample.pts)).toEqual(
			wanted.map((sample) =>
				Math.round(((sample.ptsUs - wanted[0].ptsUs) * 90000) / 1_000_000)
			)
		);
		expect(progress).toHaveLength(wanted.length);
		expect(progress[0]).toBeCloseTo(1 / wanted.length);
		expect(progress.at(-1)).toBe(0.99);
	});
});
