import { describe, expect, it } from 'vitest';

import { compositeInPlace, withBackground } from './composite';
import type { FrameSource } from './encode';
import type { RgbaImage } from './warp';

function pixel(values: number[]): RgbaImage {
	return {
		width: 1,
		height: 1,
		data: Uint8ClampedArray.from(values)
	};
}

describe('background compositing', () => {
	it('leaves an opaque foreground unchanged', () => {
		const frame = pixel([12, 34, 56, 255]);
		expect(
			compositeInPlace(frame, { type: 'color', rgb: [200, 210, 220] }).data
		).toEqual(Uint8ClampedArray.of(12, 34, 56, 255));
	});

	it('replaces a fully transparent foreground with the background pixel', () => {
		const frame = pixel([90, 80, 70, 0]);
		const background = pixel([12, 34, 56, 128]);
		expect(
			compositeInPlace(frame, { type: 'image', image: background }).data
		).toEqual(Uint8ClampedArray.of(12, 34, 56, 128));
	});

	it('blends a half-transparent foreground over a colour', () => {
		const frame = pixel([200, 100, 0, 128]);
		expect(
			compositeInPlace(frame, { type: 'color', rgb: [0, 100, 200] }).data
		).toEqual(Uint8ClampedArray.of(100, 100, 100, 255));
	});

	it('rejects image backgrounds with a different size', () => {
		const frame = pixel([0, 0, 0, 0]);
		const background = {
			width: 2,
			height: 1,
			data: new Uint8ClampedArray(8)
		};
		expect(() =>
			compositeInPlace(frame, { type: 'image', image: background })
		).toThrow(RangeError);
	});

	it('preserves frame metadata and composites every rendered frame', () => {
		const source: FrameSource = {
			width: 1,
			height: 1,
			frameCount: 2,
			delayCentiseconds: 7,
			render(index, target) {
				const data = target ?? new Uint8ClampedArray(4);
				data.set([index * 100, 0, 0, index === 0 ? 0 : 255]);
				return { width: 1, height: 1, data };
			}
		};
		const frames = withBackground(source, {
			type: 'color',
			rgb: [10, 20, 30]
		});

		expect(frames).toMatchObject({
			width: 1,
			height: 1,
			frameCount: 2,
			delayCentiseconds: 7
		});
		expect(frames.render(0).data).toEqual(
			Uint8ClampedArray.of(10, 20, 30, 255)
		);
		expect(frames.render(1).data).toEqual(Uint8ClampedArray.of(100, 0, 0, 255));
	});
});
