export type WobbleMode = 'wave' | 'shake' | 'squish';
export type WobbleDirection = 'horizontal' | 'vertical' | 'both';

export interface WobbleSettings {
	mode: WobbleMode;
	amplitude: number;
	wavelength: number;
	cycles: number;
	frameCount: number;
	delayCentiseconds: number;
	direction: WobbleDirection;
}

export const DEFAULT_SETTINGS: WobbleSettings = {
	mode: 'wave',
	amplitude: 12,
	wavelength: 160,
	cycles: 1,
	frameCount: 24,
	delayCentiseconds: 4,
	direction: 'both'
};

export const MAX_SOURCE_EDGE = 512;
export const MAX_PIXELS_PER_JOB = 512 * 512 * 60;
export const MIN_SPEED_HZ = 0.25;
export const MAX_SPEED_HZ = 5;

function normalizedNumber(
	value: unknown,
	fallback: number,
	minimum: number,
	maximum: number
): number {
	if (typeof value !== 'number' || Number.isNaN(value)) {
		return fallback;
	}

	return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export function normalizeSettings(input: unknown): WobbleSettings | null {
	if (typeof input !== 'object' || input === null) {
		return null;
	}

	const values = input as Record<string, unknown>;
	const mode = values.mode;
	const direction = values.direction;

	return {
		mode:
			mode === 'wave' || mode === 'shake' || mode === 'squish'
				? mode
				: DEFAULT_SETTINGS.mode,
		amplitude: normalizedNumber(
			values.amplitude,
			DEFAULT_SETTINGS.amplitude,
			0,
			64
		),
		wavelength: normalizedNumber(
			values.wavelength,
			DEFAULT_SETTINGS.wavelength,
			16,
			1024
		),
		cycles: normalizedNumber(values.cycles, DEFAULT_SETTINGS.cycles, 1, 4),
		frameCount: normalizedNumber(
			values.frameCount,
			DEFAULT_SETTINGS.frameCount,
			4,
			60
		),
		delayCentiseconds: normalizedNumber(
			values.delayCentiseconds,
			DEFAULT_SETTINGS.delayCentiseconds,
			2,
			20
		),
		direction:
			direction === 'horizontal' ||
			direction === 'vertical' ||
			direction === 'both'
				? direction
				: DEFAULT_SETTINGS.direction
	};
}

export function estimateGifBytes(
	width: number,
	height: number,
	frameCount: number
): number {
	return Math.round(0.45 * width * height * frameCount + 800);
}

export function frameCountForSpeed(
	delayCentiseconds: number,
	hz: number
): number {
	return Math.min(60, Math.max(4, Math.round(100 / delayCentiseconds / hz)));
}

export function speedHz(settings: WobbleSettings): number {
	return 100 / (settings.delayCentiseconds * settings.frameCount);
}

export function loopDurationMs(settings: WobbleSettings): number {
	return settings.frameCount * settings.delayCentiseconds * 10;
}
