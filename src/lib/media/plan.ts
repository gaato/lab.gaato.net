export type AudioMode = 'none' | 'copy' | 'encode-aac' | 'encode-opus';

export interface PlanInput {
	durationUs: number;
	width: number;
	height: number;
	fps: number;
	rotation: 0 | 90 | 180 | 270;
	targetBytes: number;
	audioPresent: boolean;
	videoSourceBitrate?: number;
	audioSourceBitrate?: number;
	audioCodec?: string;
	keepAudio: boolean;
	aacEncodeSupported: boolean;
}

export interface EncodePlan {
	width: number;
	height: number;
	fps: number;
	videoBitrate: number;
	audioMode: AudioMode;
	audioBitrate: number;
	estimatedOverheadBytes: number;
	tooSmall: boolean;
	minimumFeasibleBytes: number;
}

const resolutionLadder = [2160, 1440, 1080, 720, 540, 480, 360, 240] as const;
const GOOD_BITS_PER_PIXEL_FRAME = 0.07;
const MIN_BITS_PER_PIXEL_FRAME = 0.04;
const MIN_VIDEO_BITRATE = 32_000;

function even(value: number): number {
	return Math.max(2, Math.floor(value / 2) * 2);
}

function dimensionsForShortEdge(
	width: number,
	height: number,
	shortEdge: number
): [number, number] {
	const sourceShort = Math.min(width, height);
	const scale = Math.min(1, shortEdge / sourceShort);
	return [even(width * scale), even(height * scale)];
}

function audioBitrateFor(totalBitrate: number): number {
	const share = totalBitrate * 0.15;
	for (const bitrate of [128_000, 96_000, 64_000, 48_000, 32_000]) {
		if (bitrate <= share) return bitrate;
	}
	return 32_000;
}

/**
 * Plans a conservative H.264 encode. 0.07 bits/pixel/frame is the quality
 * selection threshold; 0.04 at the 240p/15 fps floor defines an infeasible
 * target. Four percent of the requested size is held back for rate-control
 * variance, in addition to estimated MP4 sample-table overhead.
 */
export function planEncode(input: PlanInput): EncodePlan {
	const durationSeconds = Math.max(input.durationUs / 1_000_000, 0.001);
	const sourceFps = Math.min(60, Math.max(1, input.fps || 30));
	const estimatedSamples =
		Math.ceil(durationSeconds * sourceFps) +
		(input.audioPresent && input.keepAudio
			? Math.ceil(durationSeconds * 50)
			: 0);
	const estimatedOverheadBytes = 1024 + estimatedSamples * 12;
	const payloadBytes = Math.max(
		0,
		input.targetBytes * 0.96 - estimatedOverheadBytes
	);
	const totalBitrate = (payloadBytes * 8) / durationSeconds;
	const wantsAudio = input.audioPresent && input.keepAudio;
	const audioBitrate = wantsAudio ? audioBitrateFor(totalBitrate) : 0;
	const audioMode: AudioMode = !wantsAudio
		? 'none'
		: input.audioSourceBitrate !== undefined &&
			  input.audioSourceBitrate <= audioBitrate &&
			  (input.audioCodec?.startsWith('mp4a.40.') ||
					input.audioCodec === 'opus')
			? 'copy'
			: input.aacEncodeSupported
				? 'encode-aac'
				: 'encode-opus';
	const videoBitrate = Math.max(
		MIN_VIDEO_BITRATE,
		Math.floor(totalBitrate - audioBitrate)
	);

	const displayWidth =
		input.rotation === 90 || input.rotation === 270
			? input.height
			: input.width;
	const displayHeight =
		input.rotation === 90 || input.rotation === 270
			? input.width
			: input.height;
	const sourceShort = Math.min(displayWidth, displayHeight);
	const rungs = resolutionLadder.filter((rung) => rung <= sourceShort);
	if (!rungs.length)
		rungs.push(sourceShort as (typeof resolutionLadder)[number]);

	let chosenDisplay: [number, number] = dimensionsForShortEdge(
		displayWidth,
		displayHeight,
		rungs.at(-1) ?? sourceShort
	);
	let chosenFps = Math.min(sourceFps, 15);
	outer: for (const fps of [
		...new Set([sourceFps, Math.min(sourceFps, 30), Math.min(sourceFps, 15)])
	]) {
		for (const rung of rungs) {
			const dimensions = dimensionsForShortEdge(
				displayWidth,
				displayHeight,
				rung
			);
			const bpp = videoBitrate / (dimensions[0] * dimensions[1] * fps);
			if (bpp >= GOOD_BITS_PER_PIXEL_FRAME) {
				chosenDisplay = dimensions;
				chosenFps = fps;
				break outer;
			}
		}
	}

	const floorDimensions = dimensionsForShortEdge(
		displayWidth,
		displayHeight,
		Math.min(240, sourceShort)
	);
	const floorFps = Math.min(sourceFps, 15);
	const requiredVideoBitrate =
		floorDimensions[0] *
		floorDimensions[1] *
		floorFps *
		MIN_BITS_PER_PIXEL_FRAME;
	const requiredPayload =
		((requiredVideoBitrate + audioBitrate) * durationSeconds) / 8;
	const minimumFeasibleBytes = Math.ceil(
		(requiredPayload + estimatedOverheadBytes) / 0.96
	);
	const tooSmall = input.targetBytes < minimumFeasibleBytes;

	// Size budgets are ceilings, not a reason to inflate small sources. Apply
	// the source cap after choosing dimensions so low source bitrates do not
	// force an otherwise unnecessary downscale.
	const sourceCap =
		chosenDisplay[0] * chosenDisplay[1] ===
			even(input.width) * even(input.height) &&
		(input.videoSourceBitrate ?? 0) > 0
			? input.videoSourceBitrate!
			: Infinity;
	const cappedVideoBitrate = Math.max(
		1,
		Math.floor(
			Math.min(
				videoBitrate,
				sourceCap,
				chosenDisplay[0] * chosenDisplay[1] * chosenFps * 0.3
			)
		)
	);
	const rotated = input.rotation === 90 || input.rotation === 270;
	return {
		width: rotated ? chosenDisplay[1] : chosenDisplay[0],
		height: rotated ? chosenDisplay[0] : chosenDisplay[1],
		fps: chosenFps,
		videoBitrate: cappedVideoBitrate,
		audioMode,
		audioBitrate,
		estimatedOverheadBytes,
		tooSmall,
		minimumFeasibleBytes
	};
}

export function nextAttemptBitrate(
	previous: number,
	actualBytes: number,
	budgetBytes: number
): number {
	if (!(previous > 0) || !(actualBytes > 0) || !(budgetBytes > 0))
		return MIN_VIDEO_BITRATE;
	const adjusted = Math.floor(previous * (budgetBytes / actualBytes) * 0.94);
	return Math.max(
		Math.min(MIN_VIDEO_BITRATE, previous),
		Math.min(previous - 1, adjusted)
	);
}

export const planningThresholds = {
	goodBitsPerPixelFrame: GOOD_BITS_PER_PIXEL_FRAME,
	minimumBitsPerPixelFrame: MIN_BITS_PER_PIXEL_FRAME,
	minimumVideoBitrate: MIN_VIDEO_BITRATE
} as const;
