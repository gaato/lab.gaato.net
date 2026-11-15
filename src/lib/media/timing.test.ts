import { describe, expect, it } from 'vitest';

import { selectFrameIndices, trimEndUs } from './timing';

describe('trim timing', () => {
	it.each([10_008_000, 2_499_989])(
		'preserves the entire %i us source',
		(duration) => {
			expect(trimEndUs(duration / 1_000_000, duration)).toBe(duration);
			expect(trimEndUs(Math.round(duration / 1000) / 1000, duration)).toBe(
				duration
			);
			expect(trimEndUs((duration - 999) / 1_000_000, duration)).toBe(duration);
			expect(trimEndUs((duration - 1001) / 1_000_000, duration)).toBe(
				duration - 1001
			);
		}
	);
});

describe('frame selection', () => {
	it('keeps all frames at equal fps despite alternating ±4 ms jitter', () => {
		const times = Array.from({ length: 300 }, (_, index) =>
			Math.round((index * 1_000_000) / 30 + (index % 2 ? 4000 : -4000))
		);
		expect(selectFrameIndices(times, -4000, 10_000_000, 30.01, 30)).toEqual(
			times.map((_, index) => index)
		);
	});

	it('keeps every other frame for 60 to 30 on a trim-relative grid', () => {
		const start = 123456;
		const times = Array.from(
			{ length: 120 },
			(_, index) => start + Math.round((index * 1_000_000) / 60)
		);
		expect(selectFrameIndices(times, start, start + 2_000_000, 60, 30)).toEqual(
			Array.from({ length: 60 }, (_, index) => index * 2)
		);
	});

	it('keeps 59.94 to 30 stable over a minute without accumulating drift', () => {
		const times = Array.from({ length: 3597 }, (_, index) =>
			Math.round((index * 1_000_000) / 59.94)
		);
		const selected = selectFrameIndices(times, 0, 60_000_000, 59.94, 30);
		expect(selected.length).toBeGreaterThanOrEqual(1799);
		expect(selected.length).toBeLessThanOrEqual(1801);
		for (let index = 1; index < selected.length; index += 1)
			expect(selected[index] - selected[index - 1]).toBeLessThanOrEqual(2);
	});

	it('handles decode-order timestamps and excludes frames outside the trim', () => {
		expect(
			selectFrameIndices(
				[0, 100000, 33333, 66667, 133333],
				33333,
				120000,
				30,
				30
			)
		).toEqual([2, 3, 1]);
	});
});
