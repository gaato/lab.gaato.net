import { describe, expect, it } from 'vitest';

import {
	DEFAULT_SETTINGS,
	estimateGifBytes,
	loopDurationMs,
	normalizeSettings
} from './settings';

describe('wobble settings', () => {
	it('rejects non-object settings and fills missing fields', () => {
		expect(normalizeSettings(null)).toBeNull();
		expect(normalizeSettings('x')).toBeNull();
		expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
	});

	it('clamps numeric fields to their supported ranges', () => {
		expect(
			normalizeSettings({
				amplitude: 100,
				wavelength: 1,
				cycles: 20,
				frameCount: 2,
				delayCentiseconds: 50
			})
		).toMatchObject({
			amplitude: 64,
			wavelength: 16,
			cycles: 4,
			frameCount: 4,
			delayCentiseconds: 20
		});
	});

	it('rounds every numeric setting to an integer', () => {
		expect(
			normalizeSettings({
				amplitude: 12.6,
				wavelength: 160.4,
				cycles: 2.7,
				frameCount: 23.5,
				delayCentiseconds: 4.4
			})
		).toMatchObject({
			amplitude: 13,
			wavelength: 160,
			cycles: 3,
			frameCount: 24,
			delayCentiseconds: 4
		});
	});

	it('uses defaults for invalid enums and numbers', () => {
		expect(
			normalizeSettings({
				mode: 'bounce',
				direction: 'diagonal',
				amplitude: Number.NaN,
				wavelength: 'short'
			})
		).toEqual(DEFAULT_SETTINGS);
	});

	it('estimates output size and calculates loop duration', () => {
		expect(estimateGifBytes(100, 80, 10)).toBe(36_800);
		expect(loopDurationMs(DEFAULT_SETTINGS)).toBe(960);
	});
});
