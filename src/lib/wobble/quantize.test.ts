import { describe, expect, it } from 'vitest';

import { PaletteBuilder, quantizeFrames } from './quantize';
import type { RgbaImage } from './warp';

function image(
	width: number,
	height: number,
	pixel: (x: number, y: number) => [number, number, number, number]
): RgbaImage {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			data.set(pixel(x, y), (y * width + x) * 4);
		}
	}
	return { width, height, data };
}

describe('colour quantization', () => {
	it('preserves a small exact palette and reserves transparency', () => {
		const colours = [
			[255, 0, 0],
			[0, 255, 0],
			[0, 0, 255],
			[250, 200, 10]
		] as const;
		const source = image(5, 3, (x, y) =>
			x === 4 ? [99, 88, 77, 0] : [...colours[(x + y) % colours.length], 255]
		);
		const result = quantizeFrames([source]);
		expect(result.paletteSize).toBe(8);
		expect(result.palette.slice(0, 3)).toEqual(Uint8Array.of(0, 0, 0));
		for (let pixel = 0; pixel < source.width * source.height; pixel += 1) {
			const sourceOffset = pixel * 4;
			const paletteIndex = result.frames[0][pixel];
			if (source.data[sourceOffset + 3] < 128) {
				expect(paletteIndex).toBe(0);
			} else {
				const paletteOffset = paletteIndex * 3;
				expect(
					Array.from(result.palette.slice(paletteOffset, paletteOffset + 3))
				).toEqual(
					Array.from(source.data.slice(sourceOffset, sourceOffset + 3))
				);
			}
		}
	});

	it('reserves index zero for a fully opaque image', () => {
		const result = quantizeFrames([
			image(3, 2, (x, y) => [x * 50, y * 100, 20, 255])
		]);
		expect(result.transparentIndex).toBe(0);
		expect(result.palette.slice(0, 3)).toEqual(Uint8Array.of(0, 0, 0));
		expect(result.frames[0].every((index) => index !== 0)).toBe(true);
	});

	it('median-cuts a large gradient with low mean error', () => {
		const source = image(128, 128, (x, y) => [
			x * 2,
			y * 2,
			(x + y) & 255,
			255
		]);
		const result = quantizeFrames([source]);
		expect(result.paletteSize).toBe(256);
		let absoluteError = 0;
		for (let pixel = 0; pixel < result.frames[0].length; pixel += 1) {
			const paletteIndex = result.frames[0][pixel];
			expect(paletteIndex).toBeGreaterThan(0);
			expect(paletteIndex).toBeLessThan(256);
			for (let channel = 0; channel < 3; channel += 1) {
				absoluteError += Math.abs(
					source.data[pixel * 4 + channel] -
						result.palette[paletteIndex * 3 + channel]
				);
			}
		}
		expect(absoluteError / (source.width * source.height * 3)).toBeLessThan(12);
	});

	it('uses alpha 128 as opaque and alpha 127 as transparent', () => {
		const source = image(2, 1, (x) => [10, 20, 30, x === 0 ? 127 : 128]);
		const result = quantizeFrames([source]);
		expect(Array.from(result.frames[0])).toEqual([0, 1]);
	});

	it('builds the same palette when frames are added incrementally', () => {
		const first = image(3, 2, (x, y) => [x * 40, y * 70, 10, 255]);
		const second = image(2, 3, (x, y) => [200, x * 80, y * 30, 255]);
		const builder = new PaletteBuilder();
		builder.add(first);
		builder.add(second);
		const mapper = builder.build();
		const combined = quantizeFrames([first, second]);
		expect(mapper.paletteSize).toBe(combined.paletteSize);
		expect(mapper.palette).toEqual(combined.palette);
		expect(mapper.map(first)).toEqual(combined.frames[0]);
		expect(mapper.map(second)).toEqual(combined.frames[1]);
	});
});
