import type { WobbleDirection, WobbleSettings } from './settings';

export interface RgbaImage {
	width: number;
	height: number;
	data: Uint8ClampedArray;
}

export interface Vec2 {
	x: number;
	y: number;
}

/** Writes the displacement at output pixel (u, v) for phase phi into `out` (no allocation per call). */
export type DisplacementField = (
	u: number,
	v: number,
	phi: number,
	out: Vec2
) => void;

export function add(...fields: DisplacementField[]): DisplacementField {
	const value = { x: 0, y: 0 };
	return (u, v, phi, out) => {
		let x = 0;
		let y = 0;
		for (const field of fields) {
			field(u, v, phi, value);
			x += value.x;
			y += value.y;
		}
		out.x = x;
		out.y = y;
	};
}

export function scale(
	field: DisplacementField,
	factor: number
): DisplacementField {
	return (u, v, phi, out) => {
		field(u, v, phi, out);
		out.x *= factor;
		out.y *= factor;
	};
}

export function restrictDirection(
	field: DisplacementField,
	direction: WobbleDirection
): DisplacementField {
	if (direction === 'horizontal') {
		return (u, v, phi, out) => {
			field(u, v, phi, out);
			out.y = 0;
		};
	}
	if (direction === 'vertical') {
		return (u, v, phi, out) => {
			field(u, v, phi, out);
			out.x = 0;
		};
	}
	return field;
}

export function wave(options: {
	amplitude: number;
	wavelength: number;
	margin: number;
}): DisplacementField {
	const { amplitude, wavelength, margin } = options;
	let cachedPhi = Number.NaN;
	let cachedV = Number.NaN;
	let cachedX = 0;
	const columnY: Array<number | undefined> = [];
	return (u, v, phi, out) => {
		if (phi !== cachedPhi) {
			cachedPhi = phi;
			cachedV = Number.NaN;
			columnY.length = 0;
		}
		if (v !== cachedV) {
			cachedV = v;
			cachedX =
				amplitude * Math.sin((2 * Math.PI * (v - margin)) / wavelength + phi);
		}
		out.x = cachedX;
		let y = Number.isInteger(u) && u >= 0 ? columnY[u] : undefined;
		if (y === undefined) {
			y =
				0.5 *
				amplitude *
				Math.sin((2 * Math.PI * (u - margin)) / wavelength + phi + Math.PI / 2);
			if (Number.isInteger(u) && u >= 0) columnY[u] = y;
		}
		out.y = y;
	};
}

export function shake(options: { amplitude: number }): DisplacementField {
	const { amplitude } = options;
	return (_u, _v, phi, out) => {
		out.x = amplitude * Math.sin(phi);
		out.y = amplitude * Math.sin(2 * phi + Math.PI / 3);
	};
}

export function squish(options: {
	amplitude: number;
	margin: number;
	width: number;
	height: number;
	direction: WobbleDirection;
}): DisplacementField {
	const { amplitude, margin, width, height, direction } = options;
	const centerX = margin + width / 2;
	const centerY = margin + height / 2;
	let cachedPhi = Number.NaN;
	let scaleX = 1;
	let scaleY = 1;
	return (u, v, phi, out) => {
		if (phi !== cachedPhi) {
			cachedPhi = phi;
			const sine = Math.sin(phi);
			scaleX = direction === 'vertical' ? 1 : 1 + (amplitude / width) * sine;
			scaleY = direction === 'horizontal' ? 1 : 1 - (amplitude / height) * sine;
		}
		out.x = u - ((u - centerX) / scaleX + centerX);
		out.y = v - ((v - centerY) / scaleY + centerY);
	};
}

export function fieldForSettings(
	settings: WobbleSettings,
	source: RgbaImage
): DisplacementField {
	const amplitude = settings.amplitude;
	const margin = amplitude;
	const primitive =
		settings.mode === 'wave'
			? wave({ amplitude, wavelength: settings.wavelength, margin })
			: settings.mode === 'shake'
				? shake({ amplitude })
				: squish({
						amplitude,
						margin,
						width: source.width,
						height: source.height,
						direction: settings.direction
					});
	return restrictDirection(primitive, settings.direction);
}

export function outputSize(
	source: RgbaImage,
	settings: WobbleSettings
): { width: number; height: number } {
	const margin = settings.amplitude;
	return {
		width: source.width + 2 * margin,
		height: source.height + 2 * margin
	};
}

export function displacement(
	settings: WobbleSettings,
	source: RgbaImage,
	u: number,
	v: number,
	phi: number
): { dx: number; dy: number } {
	const out = { x: 0, y: 0 };
	fieldForSettings(settings, source)(u, v, phi, out);
	return { dx: out.x, dy: out.y };
}

function writeBilinearSample(
	source: RgbaImage,
	x: number,
	y: number,
	target: Uint8ClampedArray,
	targetIndex: number
): void {
	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const xFraction = x - x0;
	const yFraction = y - y0;
	const weight00 = (1 - xFraction) * (1 - yFraction);
	const weight10 = xFraction * (1 - yFraction);
	const weight01 = (1 - xFraction) * yFraction;
	const weight11 = xFraction * yFraction;
	let alpha = 0;
	let red = 0;
	let green = 0;
	let blue = 0;

	if (x0 >= 0 && x0 + 1 < source.width && y0 >= 0 && y0 + 1 < source.height) {
		const index00 = (y0 * source.width + x0) * 4;
		const index10 = index00 + 4;
		const index01 = index00 + source.width * 4;
		const index11 = index01 + 4;
		const alpha00 = weight00 * source.data[index00 + 3];
		const alpha10 = weight10 * source.data[index10 + 3];
		const alpha01 = weight01 * source.data[index01 + 3];
		const alpha11 = weight11 * source.data[index11 + 3];
		alpha = alpha00 + alpha10 + alpha01 + alpha11;

		if (alpha === 0) {
			target[targetIndex] = 0;
			target[targetIndex + 1] = 0;
			target[targetIndex + 2] = 0;
			target[targetIndex + 3] = 0;
			return;
		}

		target[targetIndex] = Math.round(
			(source.data[index00] * alpha00 +
				source.data[index10] * alpha10 +
				source.data[index01] * alpha01 +
				source.data[index11] * alpha11) /
				alpha
		);
		target[targetIndex + 1] = Math.round(
			(source.data[index00 + 1] * alpha00 +
				source.data[index10 + 1] * alpha10 +
				source.data[index01 + 1] * alpha01 +
				source.data[index11 + 1] * alpha11) /
				alpha
		);
		target[targetIndex + 2] = Math.round(
			(source.data[index00 + 2] * alpha00 +
				source.data[index10 + 2] * alpha10 +
				source.data[index01 + 2] * alpha01 +
				source.data[index11 + 2] * alpha11) /
				alpha
		);
		target[targetIndex + 3] = Math.round(alpha);
		return;
	}

	if (x0 >= 0 && x0 < source.width && y0 >= 0 && y0 < source.height) {
		const sourceIndex = (y0 * source.width + x0) * 4;
		const weightedAlpha = weight00 * source.data[sourceIndex + 3];
		alpha += weightedAlpha;
		red += source.data[sourceIndex] * weightedAlpha;
		green += source.data[sourceIndex + 1] * weightedAlpha;
		blue += source.data[sourceIndex + 2] * weightedAlpha;
	}
	if (x0 + 1 >= 0 && x0 + 1 < source.width && y0 >= 0 && y0 < source.height) {
		const sourceIndex = (y0 * source.width + x0 + 1) * 4;
		const weightedAlpha = weight10 * source.data[sourceIndex + 3];
		alpha += weightedAlpha;
		red += source.data[sourceIndex] * weightedAlpha;
		green += source.data[sourceIndex + 1] * weightedAlpha;
		blue += source.data[sourceIndex + 2] * weightedAlpha;
	}
	if (x0 >= 0 && x0 < source.width && y0 + 1 >= 0 && y0 + 1 < source.height) {
		const sourceIndex = ((y0 + 1) * source.width + x0) * 4;
		const weightedAlpha = weight01 * source.data[sourceIndex + 3];
		alpha += weightedAlpha;
		red += source.data[sourceIndex] * weightedAlpha;
		green += source.data[sourceIndex + 1] * weightedAlpha;
		blue += source.data[sourceIndex + 2] * weightedAlpha;
	}
	if (
		x0 + 1 >= 0 &&
		x0 + 1 < source.width &&
		y0 + 1 >= 0 &&
		y0 + 1 < source.height
	) {
		const sourceIndex = ((y0 + 1) * source.width + x0 + 1) * 4;
		const weightedAlpha = weight11 * source.data[sourceIndex + 3];
		alpha += weightedAlpha;
		red += source.data[sourceIndex] * weightedAlpha;
		green += source.data[sourceIndex + 1] * weightedAlpha;
		blue += source.data[sourceIndex + 2] * weightedAlpha;
	}

	if (alpha === 0) {
		target[targetIndex] = 0;
		target[targetIndex + 1] = 0;
		target[targetIndex + 2] = 0;
		target[targetIndex + 3] = 0;
		return;
	}

	target[targetIndex] = Math.round(red / alpha);
	target[targetIndex + 1] = Math.round(green / alpha);
	target[targetIndex + 2] = Math.round(blue / alpha);
	target[targetIndex + 3] = Math.round(alpha);
}

export function renderWarp(
	source: RgbaImage,
	field: DisplacementField,
	margin: number,
	phi: number,
	target?: Uint8ClampedArray
): RgbaImage {
	const size = {
		width: source.width + 2 * margin,
		height: source.height + 2 * margin
	};
	const expectedLength = size.width * size.height * 4;
	if (target !== undefined && target.length !== expectedLength) {
		throw new RangeError(`target must contain exactly ${expectedLength} bytes`);
	}

	const output = target ?? new Uint8ClampedArray(expectedLength);
	const displacement = { x: 0, y: 0 };
	let targetIndex = 0;
	for (let v = 0; v < size.height; v += 1) {
		for (let u = 0; u < size.width; u += 1) {
			field(u, v, phi, displacement);
			if (margin === 0 && displacement.x === 0 && displacement.y === 0) {
				const sourceIndex = (v * source.width + u) * 4;
				output[targetIndex] = source.data[sourceIndex];
				output[targetIndex + 1] = source.data[sourceIndex + 1];
				output[targetIndex + 2] = source.data[sourceIndex + 2];
				output[targetIndex + 3] = source.data[sourceIndex + 3];
				targetIndex += 4;
				continue;
			}
			writeBilinearSample(
				source,
				u - margin - displacement.x,
				v - margin - displacement.y,
				output,
				targetIndex
			);
			targetIndex += 4;
		}
	}

	return { ...size, data: output };
}

export function renderFrame(
	source: RgbaImage,
	settings: WobbleSettings,
	frameIndex: number,
	target?: Uint8ClampedArray
): RgbaImage {
	const size = outputSize(source, settings);
	const expectedLength = size.width * size.height * 4;
	if (target !== undefined && target.length !== expectedLength) {
		throw new RangeError(`target must contain exactly ${expectedLength} bytes`);
	}

	if (settings.amplitude === 0) {
		const output = target ?? new Uint8ClampedArray(expectedLength);
		output.set(source.data);
		return { ...size, data: output };
	}

	const wrappedFrame =
		((frameIndex % settings.frameCount) + settings.frameCount) %
		settings.frameCount;
	const phi =
		(2 * Math.PI * settings.cycles * wrappedFrame) / settings.frameCount;
	return renderWarp(
		source,
		fieldForSettings(settings, source),
		settings.amplitude,
		phi,
		target
	);
}
