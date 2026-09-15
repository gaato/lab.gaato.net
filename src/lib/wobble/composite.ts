import type { FrameSource } from './encode';
import type { RgbaImage } from './warp';

export type Background =
	| { type: 'color'; rgb: [number, number, number] }
	| { type: 'image'; image: RgbaImage };

/** Composites a straight-alpha frame over a background, in place. */
export function compositeInPlace(
	frame: RgbaImage,
	background: Background
): RgbaImage {
	if (
		background.type === 'image' &&
		(background.image.width !== frame.width ||
			background.image.height !== frame.height)
	) {
		throw new RangeError('background size must match the frame size');
	}

	const foreground = frame.data;
	const backgroundPixels =
		background.type === 'image' ? background.image.data : null;
	const backgroundColor = background.type === 'color' ? background.rgb : null;
	for (let offset = 0; offset < foreground.length; offset += 4) {
		const foregroundAlpha = foreground[offset + 3] / 255;
		const backgroundAlpha = backgroundPixels
			? backgroundPixels[offset + 3] / 255
			: 1;
		const outputAlpha =
			foregroundAlpha + backgroundAlpha * (1 - foregroundAlpha);
		for (let channel = 0; channel < 3; channel += 1) {
			const backgroundChannel = backgroundPixels
				? backgroundPixels[offset + channel]
				: backgroundColor![channel];
			foreground[offset + channel] =
				outputAlpha === 0
					? 0
					: Math.round(
							(foreground[offset + channel] * foregroundAlpha +
								backgroundChannel * backgroundAlpha * (1 - foregroundAlpha)) /
								outputAlpha
						);
		}
		foreground[offset + 3] = Math.round(outputAlpha * 255);
	}
	return frame;
}

export function withBackground(
	frames: FrameSource,
	background: Background
): FrameSource {
	return {
		width: frames.width,
		height: frames.height,
		frameCount: frames.frameCount,
		delayCentiseconds: frames.delayCentiseconds,
		render(index, target) {
			return compositeInPlace(frames.render(index, target), background);
		}
	};
}
