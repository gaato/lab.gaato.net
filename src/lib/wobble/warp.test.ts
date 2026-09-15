import { describe, expect, it } from 'vitest';

import {
	displacement,
	outputSize,
	renderFrame,
	renderWarp,
	type DisplacementField,
	type RgbaImage
} from './warp';
import {
	DEFAULT_SETTINGS,
	type WobbleMode,
	type WobbleSettings
} from './settings';

function gradient(width = 16, height = 12): RgbaImage {
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			const index = (y * width + x) * 4;
			data[index] = x * 13;
			data[index + 1] = y * 17;
			data[index + 2] = (x * 7 + y * 11) % 256;
			data[index + 3] = x === 3 && y === 4 ? 0 : 255;
		}
	}
	return { width, height, data };
}

function settings(
	mode: WobbleMode,
	overrides: Partial<WobbleSettings> = {}
): WobbleSettings {
	return { ...DEFAULT_SETTINGS, mode, ...overrides };
}

function legacyField(
	value: WobbleSettings,
	source: RgbaImage
): DisplacementField {
	return (u, v, phi, out) => {
		const amplitude = value.amplitude;
		const margin = amplitude;
		let dx: number;
		let dy: number;
		if (value.mode === 'wave') {
			dx =
				amplitude *
				Math.sin((2 * Math.PI * (v - margin)) / value.wavelength + phi);
			dy =
				0.5 *
				amplitude *
				Math.sin(
					(2 * Math.PI * (u - margin)) / value.wavelength + phi + Math.PI / 2
				);
		} else if (value.mode === 'shake') {
			dx = amplitude * Math.sin(phi);
			dy = amplitude * Math.sin(2 * phi + Math.PI / 3);
		} else {
			const centerX = margin + source.width / 2;
			const centerY = margin + source.height / 2;
			const sine = Math.sin(phi);
			const scaleX =
				value.direction === 'vertical'
					? 1
					: 1 + (amplitude / source.width) * sine;
			const scaleY =
				value.direction === 'horizontal'
					? 1
					: 1 - (amplitude / source.height) * sine;
			dx = u - ((u - centerX) / scaleX + centerX);
			dy = v - ((v - centerY) / scaleY + centerY);
		}
		out.x = value.direction === 'vertical' ? 0 : dx;
		out.y = value.direction === 'horizontal' ? 0 : dy;
	};
}

describe('wobble frame rendering', () => {
	it.each<WobbleMode>(['wave', 'shake', 'squish'])(
		'matches the legacy %s inverse mapping byte for byte',
		(mode) => {
			const source = gradient(7, 5);
			const value = settings(mode, {
				amplitude: 2,
				wavelength: 7,
				frameCount: 9,
				cycles: 2,
				direction: 'both'
			});
			const frameIndex = 4;
			const phi = (2 * Math.PI * value.cycles * frameIndex) / value.frameCount;
			const legacy = renderWarp(
				source,
				legacyField(value, source),
				value.amplitude,
				phi
			);
			expect(renderFrame(source, value, frameIndex)).toEqual(legacy);
		}
	);

	it('copies every byte for a zero field with no margin', () => {
		const source = gradient(7, 5);
		const rendered = renderWarp(
			source,
			(_u, _v, _phi, out) => {
				out.x = 0;
				out.y = 0;
			},
			0,
			Math.PI / 3
		);
		expect(rendered).toEqual(source);
		expect(rendered.data).not.toBe(source.data);
	});

	it.each<WobbleMode>(['wave', 'shake', 'squish'])(
		'returns an identical image at zero amplitude in %s mode',
		(mode) => {
			const source = gradient();
			const rendered = renderFrame(source, settings(mode, { amplitude: 0 }), 7);
			expect(rendered).toEqual(source);
			expect(rendered.data).not.toBe(source.data);
		}
	);

	it.each([1, 3] as const)(
		'closes exactly after one loop with %i cycles',
		(cycles) => {
			const source = gradient();
			for (const mode of ['wave', 'shake', 'squish'] as const) {
				const value = settings(mode, { amplitude: 3, cycles, frameCount: 12 });
				const first = renderFrame(source, value, 0);
				expect(renderFrame(source, value, value.frameCount)).toEqual(first);
				expect(renderFrame(source, value, 1)).not.toEqual(first);
			}
		}
	);

	it('adds transparent margins while preserving an opaque centre', () => {
		const source = gradient();
		source.data.fill(255);
		const value = settings('wave', { amplitude: 4, direction: 'horizontal' });
		const rendered = renderFrame(source, value, 0);
		expect(outputSize(source, value)).toEqual({ width: 24, height: 20 });
		const center =
			(Math.floor(rendered.height / 2) * rendered.width +
				Math.floor(rendered.width / 2)) *
			4;
		expect(rendered.data[center + 3]).toBe(255);
		for (const index of [
			3,
			(rendered.width - 1) * 4 + 3,
			(rendered.height - 1) * rendered.width * 4 + 3,
			(rendered.width * rendered.height - 1) * 4 + 3
		]) {
			expect(rendered.data[index]).toBe(0);
		}
	});

	it('uses one position-independent displacement for shake', () => {
		const source = gradient();
		const value = settings('shake', { amplitude: 4 });
		const phi = Math.PI / 2;
		const expected = displacement(value, source, 0, 0, phi);
		expect(expected.dx).toBeCloseTo(4);
		expect(expected.dy).toBeCloseTo(-2 * Math.sqrt(3));
		for (const [u, v] of [
			[2, 3],
			[10, 8],
			[23, 19]
		]) {
			expect(displacement(value, source, u, v, phi)).toEqual(expected);
		}
	});

	it('fills and returns a provided target buffer', () => {
		const source = gradient();
		const value = settings('wave', { amplitude: 2 });
		const size = outputSize(source, value);
		const target = new Uint8ClampedArray(size.width * size.height * 4);
		const rendered = renderFrame(source, value, 2, target);
		expect(rendered.data).toBe(target);
		expect(target.some((channel) => channel !== 0)).toBe(true);
	});

	it('preserves color when alpha-weighted sampling crosses transparency', () => {
		const source: RgbaImage = {
			width: 2,
			height: 1,
			data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0])
		};
		const value = settings('shake', {
			amplitude: 1,
			frameCount: 4,
			direction: 'horizontal'
		});
		const rendered = renderFrame(source, value, 1);
		const index = (1 * rendered.width + 2) * 4;
		expect([...rendered.data.slice(index, index + 4)]).toEqual([
			255, 0, 0, 255
		]);

		const halfway = settings('shake', {
			amplitude: 1,
			frameCount: 12,
			direction: 'horizontal'
		});
		const blended = renderFrame(source, halfway, 1);
		const blendedIndex = (1 * blended.width + 2) * 4;
		expect([...blended.data.slice(blendedIndex, blendedIndex + 4)]).toEqual([
			255, 0, 0, 128
		]);
	});
});
