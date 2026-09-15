import { encodeGif } from './gif';
import { PaletteBuilder } from './quantize';
import type { WobbleSettings } from './settings';
import { outputSize, renderFrame, type RgbaImage } from './warp';

export interface EncodeResult {
	gif: Uint8Array;
	width: number;
	height: number;
	frameCount: number;
}

export interface FrameSource {
	width: number;
	height: number;
	frameCount: number;
	delayCentiseconds: number;
	/** Renders frame `index` (0..frameCount-1); may reuse `target`. Encoders may call this more than once per frame. */
	render(index: number, target?: Uint8ClampedArray): RgbaImage;
}

export type ProgressCallback = (completed: number, total: number) => void;

export type AnimationEncoder = (
	frames: FrameSource,
	onProgress?: ProgressCallback
) => Uint8Array;

export function jellyFrameSource(
	source: RgbaImage,
	settings: WobbleSettings
): FrameSource {
	const { width, height } = outputSize(source, settings);
	return {
		width,
		height,
		frameCount: settings.frameCount,
		delayCentiseconds: settings.delayCentiseconds,
		render: (index, target) => renderFrame(source, settings, index, target)
	};
}

export const encodeGifAnimation: AnimationEncoder = (frames, onProgress) => {
	const { width, height, frameCount, delayCentiseconds } = frames;
	const target = new Uint8ClampedArray(width * height * 4);
	const builder = new PaletteBuilder();
	const total = frameCount * 2 + 1;
	let completed = 0;
	for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
		builder.add(frames.render(frameIndex, target));
		onProgress?.(++completed, total);
	}
	const mapper = builder.build();
	const encodedFrames = [];
	for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
		encodedFrames.push({
			indices: mapper.map(frames.render(frameIndex, target)),
			delayCentiseconds
		});
		onProgress?.(++completed, total);
	}
	const gif = encodeGif({
		width,
		height,
		palette: mapper.palette,
		paletteSize: mapper.paletteSize,
		transparentIndex: 0,
		loop: 0,
		frames: encodedFrames
	});
	onProgress?.(++completed, total);
	return gif;
};

export type AnimationFormat = 'gif';

export const animationEncoders: Record<
	AnimationFormat,
	{ encoder: AnimationEncoder; mimeType: string; extension: string }
> = {
	gif: {
		encoder: encodeGifAnimation,
		mimeType: 'image/gif',
		extension: 'gif'
	}
};

export function encodeJellyGif(
	source: RgbaImage,
	settings: WobbleSettings,
	onProgress?: ProgressCallback
): EncodeResult {
	const frames = jellyFrameSource(source, settings);
	return {
		gif: encodeGifAnimation(frames, onProgress),
		width: frames.width,
		height: frames.height,
		frameCount: frames.frameCount
	};
}
