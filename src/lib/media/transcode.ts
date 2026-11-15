import { copyAudioData } from './audio';
import {
	blobSource,
	demuxMp4,
	MediaError,
	type DemuxedAudioTrack,
	type DemuxedTrack,
	type DemuxedVideoTrack
} from './mp4-demux';
import { muxMp4, type EncodedSample, type MuxAudioTrack } from './mp4-mux';
import { nextAttemptBitrate, planEncode, type EncodePlan } from './plan';
import { selectFrameIndices, trimEndUs } from './timing';
import type { VideoSourceInfo, VideoWorkerPhase } from './video-worker';

export class TranscodeError extends Error {
	constructor(
		readonly code:
			'decode_unsupported' | 'encode_unsupported' | 'cancelled' | 'internal',
		message: string,
		readonly detail?: string
	) {
		super(message);
		this.name = 'TranscodeError';
	}
}

export interface CancellationToken {
	cancelled: boolean;
	codecs: Set<{ close(): void }>;
}

export interface TranscodeOptions {
	targetBytes: number;
	trimStartUs: number;
	trimEndUs: number;
	keepAudio: boolean;
	aacEncodeSupported: boolean;
	onProgress?: (phase: VideoWorkerPhase, fraction: number) => void;
	onPlan?: (plan: EncodePlan) => void;
	cancellation?: CancellationToken;
}

export interface TranscodeResult {
	mp4: Uint8Array;
	plan: EncodePlan;
	attempts: number;
	exceededTarget: boolean;
}

export function createCancellationToken(): CancellationToken {
	return { cancelled: false, codecs: new Set() };
}

export function cancelTranscode(token: CancellationToken): void {
	token.cancelled = true;
	for (const codec of token.codecs) {
		try {
			codec.close();
		} catch {
			// A codec can already be closed or unconfigured.
		}
	}
	token.codecs.clear();
}

function throwIfCancelled(token: CancellationToken): void {
	if (token.cancelled)
		throw new TranscodeError('cancelled', 'video compression was cancelled');
}

function descriptionBytes(
	value: AllowSharedBufferSource | undefined
): Uint8Array | undefined {
	if (!value) return undefined;
	if (value instanceof ArrayBuffer || value instanceof SharedArrayBuffer)
		return new Uint8Array(value).slice();
	return new Uint8Array(
		value.buffer,
		value.byteOffset,
		value.byteLength
	).slice();
}

function fpsEstimate(track: DemuxedVideoTrack): number {
	const positive = track.samples.filter((sample) => sample.durationUs > 0);
	if (!positive.length) return 30;
	const total = positive.reduce((sum, sample) => sum + sample.durationUs, 0);
	return Math.min(240, (positive.length * 1_000_000) / total);
}

function bitrateEstimate(track: DemuxedTrack): number {
	const duration =
		track.samples.reduce(
			(end, sample) => Math.max(end, sample.ptsUs + sample.durationUs),
			1
		) / 1_000_000;
	return Math.round(
		(track.samples.reduce((sum, sample) => sum + sample.size, 0) * 8) / duration
	);
}

export async function inspectVideo(file: Blob): Promise<VideoSourceInfo> {
	const demuxed = await demuxMp4(blobSource(file));
	const video = demuxed.tracks.find(
		(track): track is DemuxedVideoTrack => track.kind === 'video'
	);
	if (!video)
		throw new MediaError(
			'codec_unsupported',
			'the file has no video track',
			'none'
		);
	const audio = demuxed.tracks.find(
		(track): track is DemuxedAudioTrack => track.kind === 'audio'
	);
	return {
		durationUs: demuxed.durationUs,
		video: {
			codec: video.codec,
			width: video.width,
			height: video.height,
			rotation: video.rotation,
			fps: fpsEstimate(video),
			bitrate: bitrateEstimate(video)
		},
		...(audio
			? {
					audio: {
						codec: audio.codec,
						channelCount: audio.channelCount,
						sampleRate: audio.sampleRate,
						bitrate: bitrateEstimate(audio)
					}
				}
			: {})
	};
}

function avcLevel(width: number, height: number, fps: number): string {
	const macroblocks = Math.ceil(width / 16) * Math.ceil(height / 16);
	const perSecond = macroblocks * fps;
	if (macroblocks <= 3600 && perSecond <= 108_000) return '1F';
	if (macroblocks <= 8192 && perSecond <= 245_760) return '28';
	if (macroblocks <= 8704 && perSecond <= 522_240) return '2A';
	if (macroblocks <= 36_864 && perSecond <= 983_040) return '33';
	return '34';
}

async function waitForQueue(
	_codec: EventTarget,
	queueSize: () => number,
	token: CancellationToken,
	maximum = 8
): Promise<void> {
	while (queueSize() > maximum) {
		throwIfCancelled(token);
		// Polling also wakes after close(), whereas a codec is not required to emit
		// another dequeue event once cancellation closes it.
		await new Promise<void>((resolve) => setTimeout(resolve, 5));
	}
}

async function encodeVideo(
	demuxed: Awaited<ReturnType<typeof demuxMp4>>,
	track: DemuxedVideoTrack,
	plan: EncodePlan,
	bitrate: number,
	startUs: number,
	endUs: number,
	token: CancellationToken,
	onProgress?: (phase: VideoWorkerPhase, fraction: number) => void
): Promise<{ samples: EncodedSample[]; description: Uint8Array }> {
	throwIfCancelled(token);
	const decoderConfig: VideoDecoderConfig = {
		codec: track.codec,
		codedWidth: track.width,
		codedHeight: track.height,
		...(track.description ? { description: track.description } : {})
	};
	let decoderSupport: VideoDecoderSupport;
	try {
		decoderSupport = await VideoDecoder.isConfigSupported(decoderConfig);
	} catch {
		throw new TranscodeError(
			'decode_unsupported',
			`Video decoding is unavailable for ${track.codec}`,
			track.codec
		);
	}
	if (!decoderSupport.supported)
		throw new TranscodeError(
			'decode_unsupported',
			`Video decoding is unavailable for ${track.codec}`,
			track.codec
		);

	const codec = `avc1.6400${avcLevel(plan.width, plan.height, plan.fps)}`;
	const encoderConfig = {
		codec,
		width: plan.width,
		height: plan.height,
		bitrate,
		framerate: plan.fps,
		bitrateMode: 'variable',
		latencyMode: 'quality',
		avc: { format: 'avc' }
	} as VideoEncoderConfig;
	let encoderSupport: VideoEncoderSupport;
	try {
		encoderSupport = await VideoEncoder.isConfigSupported(encoderConfig);
	} catch {
		throw new TranscodeError(
			'encode_unsupported',
			`H.264 encoding is unavailable for ${codec}`,
			codec
		);
	}
	if (!encoderSupport.supported)
		throw new TranscodeError(
			'encode_unsupported',
			`H.264 encoding is unavailable for ${codec}`,
			codec
		);

	const samples: EncodedSample[] = [];
	let description: Uint8Array | undefined;
	let callbackError: Error | undefined;
	const selectedIndices = selectFrameIndices(
		track.samples.map((sample) => sample.ptsUs),
		startUs,
		endUs,
		fpsEstimate(track),
		plan.fps
	);
	const selectedTimestamps = new Set(
		selectedIndices.map((index) => track.samples[index].ptsUs)
	);
	let nextKeyframe = 0;
	let outputCount = 0;
	const interval = 1_000_000 / plan.fps;
	const canvas = new OffscreenCanvas(plan.width, plan.height);
	const context = canvas.getContext('2d', { alpha: false });
	if (!context)
		throw new TranscodeError('internal', 'OffscreenCanvas 2D is unavailable');

	const encoder = new VideoEncoder({
		output(chunk, metadata) {
			try {
				const data = new Uint8Array(chunk.byteLength);
				chunk.copyTo(data);
				samples.push({
					data,
					timestampUs: chunk.timestamp,
					durationUs: chunk.duration ?? Math.round(interval),
					keyframe: chunk.type === 'key'
				});
				description ??= descriptionBytes(metadata?.decoderConfig?.description);
				outputCount += 1;
				onProgress?.(
					'encode',
					Math.min(0.99, outputCount / Math.max(1, selectedIndices.length))
				);
			} catch (error) {
				callbackError =
					error instanceof Error ? error : new Error(String(error));
			}
		},
		error(error) {
			callbackError = error;
		}
	});
	token.codecs.add(encoder);
	encoder.configure(encoderConfig);

	const decoder = new VideoDecoder({
		output(frame) {
			try {
				throwIfCancelled(token);
				const timestamp = frame.timestamp;
				if (!selectedTimestamps.has(timestamp)) return;
				const rebased = Math.max(0, timestamp - startUs);
				context.drawImage(frame, 0, 0, plan.width, plan.height);
				const resized = new VideoFrame(canvas, {
					timestamp: rebased,
					duration: Math.max(1, Math.min(interval, endUs - timestamp))
				});
				const keyFrame = rebased >= nextKeyframe;
				encoder.encode(resized, { keyFrame });
				resized.close();
				if (keyFrame) nextKeyframe = rebased + 2_000_000;
			} catch (error) {
				callbackError =
					error instanceof Error ? error : new Error(String(error));
			} finally {
				frame.close();
			}
		},
		error(error) {
			callbackError = error;
		}
	});
	token.codecs.add(decoder);
	decoder.configure(decoderConfig);

	let firstIndex = 0;
	for (let index = 0; index < track.samples.length; index += 1) {
		const sample = track.samples[index];
		if (sample.keyframe && sample.ptsUs <= startUs) firstIndex = index;
		if (sample.ptsUs > startUs) break;
	}
	const selected = track.samples
		.map((sample, index) => ({ sample, index }))
		.slice(firstIndex)
		.filter(({ sample }) => sample.dtsUs < endUs + 2_000_000);
	try {
		for (let position = 0; position < selected.length; position += 1) {
			throwIfCancelled(token);
			if (callbackError) throw callbackError;
			const { sample, index } = selected[position];
			const data = await demuxed.readSample(track, index);
			decoder.decode(
				new EncodedVideoChunk({
					type: sample.keyframe ? 'key' : 'delta',
					timestamp: sample.ptsUs,
					duration: sample.durationUs,
					data
				})
			);
			onProgress?.('decode', (position + 1) / selected.length);
			await waitForQueue(decoder, () => decoder.decodeQueueSize, token);
			await waitForQueue(encoder, () => encoder.encodeQueueSize, token);
		}
		await decoder.flush();
		if (callbackError) throw callbackError;
		await encoder.flush();
		if (callbackError) throw callbackError;
	} catch (error) {
		if (token.cancelled)
			throw new TranscodeError('cancelled', 'video compression was cancelled');
		throw error;
	} finally {
		token.codecs.delete(decoder);
		token.codecs.delete(encoder);
		try {
			decoder.close();
		} catch {
			// Cancellation may already have closed it.
		}
		try {
			encoder.close();
		} catch {
			// Cancellation may already have closed it.
		}
	}
	if (!description)
		throw new TranscodeError(
			'internal',
			'H.264 encoder returned no decoder configuration'
		);
	return { samples, description };
}

async function prepareAudio(
	demuxed: Awaited<ReturnType<typeof demuxMp4>>,
	track: DemuxedAudioTrack | undefined,
	plan: EncodePlan,
	startUs: number,
	endUs: number,
	token: CancellationToken,
	onProgress?: (phase: VideoWorkerPhase, fraction: number) => void
): Promise<MuxAudioTrack | undefined> {
	if (!track || plan.audioMode === 'none') return undefined;
	const selected = track.samples
		.map((sample, index) => ({ sample, index }))
		.filter(
			({ sample }) =>
				sample.ptsUs + sample.durationUs > startUs && sample.ptsUs < endUs
		);
	if (plan.audioMode === 'copy') {
		const samples: EncodedSample[] = [];
		for (let position = 0; position < selected.length; position += 1) {
			throwIfCancelled(token);
			const { sample, index } = selected[position];
			samples.push({
				data: await demuxed.readSample(track, index),
				timestampUs: Math.max(0, sample.ptsUs - startUs),
				durationUs: Math.min(
					sample.durationUs,
					endUs - Math.max(startUs, sample.ptsUs)
				),
				keyframe: true
			});
			onProgress?.('audio', (position + 1) / selected.length);
		}
		return {
			sampleEntry: track.sampleEntry,
			description: track.description,
			channelCount: track.channelCount,
			sampleRate: track.sampleRate,
			samples
		};
	}

	const outputRate = track.sampleRate;
	const outputChannels = Math.min(2, track.channelCount);
	const encoderConfig = {
		codec: plan.audioMode === 'encode-opus' ? 'opus' : 'mp4a.40.2',
		sampleRate: outputRate,
		numberOfChannels: outputChannels,
		bitrate: plan.audioBitrate,
		bitrateMode: 'variable',
		...(plan.audioMode === 'encode-aac' ? { aac: { format: 'aac' } } : {})
	} as AudioEncoderConfig;
	const support = await AudioEncoder.isConfigSupported(encoderConfig);
	if (!support.supported)
		throw new TranscodeError(
			'encode_unsupported',
			`Audio encoding is unavailable for ${encoderConfig.codec}`,
			encoderConfig.codec
		);
	const samples: EncodedSample[] = [];
	let description: Uint8Array | undefined;
	// Opus has a 48 kHz decode clock even when the encoder accepts 44.1 kHz PCM.
	let encodedRate = plan.audioMode === 'encode-opus' ? 48000 : outputRate;
	let callbackError: Error | undefined;
	const encoder = new AudioEncoder({
		output(chunk, metadata) {
			const data = new Uint8Array(chunk.byteLength);
			chunk.copyTo(data);
			samples.push({
				data,
				timestampUs: chunk.timestamp,
				durationUs: chunk.duration ?? 0,
				keyframe: true
			});
			description ??= descriptionBytes(metadata?.decoderConfig?.description);
			encodedRate = metadata?.decoderConfig?.sampleRate ?? encodedRate;
		},
		error(error) {
			callbackError = error;
		}
	});
	token.codecs.add(encoder);
	encoder.configure(encoderConfig);
	const decoderConfig: AudioDecoderConfig = {
		codec: track.codec,
		sampleRate: track.sampleRate,
		numberOfChannels: track.channelCount,
		...(track.description ? { description: track.description } : {})
	};
	const decoderSupport = await AudioDecoder.isConfigSupported(decoderConfig);
	if (!decoderSupport.supported)
		throw new TranscodeError(
			'decode_unsupported',
			`Audio decoding is unavailable for ${track.codec}`,
			track.codec
		);
	const decoder = new AudioDecoder({
		output(frame) {
			try {
				if (frame.timestamp >= endUs) return;
				const converted = copyAudioData(
					frame,
					Math.max(0, frame.timestamp - startUs)
				);
				try {
					encoder.encode(converted);
				} finally {
					converted.close();
				}
			} catch (error) {
				callbackError =
					error instanceof Error ? error : new Error(String(error));
			} finally {
				frame.close();
			}
		},
		error(error) {
			callbackError = error;
		}
	});
	token.codecs.add(decoder);
	decoder.configure(decoderConfig);
	try {
		for (let position = 0; position < selected.length; position += 1) {
			throwIfCancelled(token);
			if (callbackError) throw callbackError;
			const { sample, index } = selected[position];
			decoder.decode(
				new EncodedAudioChunk({
					type: 'key',
					timestamp: sample.ptsUs,
					duration: sample.durationUs,
					data: await demuxed.readSample(track, index)
				})
			);
			onProgress?.('audio', (position + 1) / selected.length);
			await waitForQueue(decoder, () => decoder.decodeQueueSize, token);
			await waitForQueue(encoder, () => encoder.encodeQueueSize, token);
		}
		await decoder.flush();
		if (callbackError) throw callbackError;
		await encoder.flush();
		if (callbackError) throw callbackError;
	} catch (error) {
		if (token.cancelled)
			throw new TranscodeError('cancelled', 'video compression was cancelled');
		throw error;
	} finally {
		token.codecs.delete(decoder);
		token.codecs.delete(encoder);
		try {
			decoder.close();
		} catch {
			/* cancelled */
		}
		try {
			encoder.close();
		} catch {
			/* cancelled */
		}
	}
	return {
		sampleEntry: plan.audioMode === 'encode-opus' ? 'Opus' : 'mp4a',
		description,
		channelCount: outputChannels,
		sampleRate: encodedRate,
		samples
	};
}

export async function transcodeVideo(
	file: Blob,
	options: TranscodeOptions
): Promise<TranscodeResult> {
	const token = options.cancellation ?? createCancellationToken();
	throwIfCancelled(token);
	const demuxed = await demuxMp4(blobSource(file));
	const video = demuxed.tracks.find(
		(track): track is DemuxedVideoTrack => track.kind === 'video'
	);
	if (!video)
		throw new MediaError(
			'codec_unsupported',
			'the file has no video track',
			'none'
		);
	const audio = demuxed.tracks.find(
		(track): track is DemuxedAudioTrack => track.kind === 'audio'
	);
	const startUs = Math.max(0, options.trimStartUs);
	const endUs = trimEndUs(options.trimEndUs / 1_000_000, demuxed.durationUs);
	if (endUs <= startUs)
		throw new TranscodeError('internal', 'trim range is empty');
	const plan = planEncode({
		durationUs: endUs - startUs,
		width: video.width,
		height: video.height,
		fps: fpsEstimate(video),
		videoSourceBitrate: bitrateEstimate(video),
		rotation: video.rotation,
		targetBytes: options.targetBytes,
		audioPresent: Boolean(audio),
		audioSourceBitrate: audio ? bitrateEstimate(audio) : undefined,
		audioCodec: audio?.codec,
		keepAudio: options.keepAudio,
		aacEncodeSupported: options.aacEncodeSupported
	});
	options.onPlan?.(plan);
	const muxAudio = await prepareAudio(
		demuxed,
		audio,
		plan,
		startUs,
		endUs,
		token,
		options.onProgress
	);
	let bitrate = plan.videoBitrate;
	let smallest: Uint8Array | undefined;
	let smallestBitrate = bitrate;
	let attempts = 0;
	for (; attempts < 3; attempts += 1) {
		throwIfCancelled(token);
		const encoded = await encodeVideo(
			demuxed,
			video,
			plan,
			bitrate,
			startUs,
			endUs,
			token,
			options.onProgress
		);
		options.onProgress?.('mux', 0.5);
		const result = muxMp4({
			video: {
				sampleEntry: 'avc1',
				description: encoded.description,
				width: plan.width,
				height: plan.height,
				rotation: video.rotation,
				samples: encoded.samples
			},
			audio: muxAudio
		});
		options.onProgress?.('mux', 1);
		if (!smallest || result.length < smallest.length) {
			smallest = result;
			smallestBitrate = bitrate;
		}
		if (result.length <= options.targetBytes)
			return {
				mp4: result,
				plan: { ...plan, videoBitrate: bitrate },
				attempts: attempts + 1,
				exceededTarget: false
			};
		bitrate = nextAttemptBitrate(bitrate, result.length, options.targetBytes);
	}
	return {
		mp4: smallest!,
		plan: { ...plan, videoBitrate: smallestBitrate },
		attempts,
		exceededTarget: true
	};
}
