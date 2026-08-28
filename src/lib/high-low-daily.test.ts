import { describe, expect, it } from 'vitest';

import {
	DAILY_HIGH_LOW_LIMIT,
	PAYING_HAND_RANKS,
	calculateCashout,
	calculateDailySubtotal,
	createDailyHighLowProgress,
	enumerateCashoutOptions,
	getDailyHighLowDayKey,
	loadDailyHighLowProgress,
	millisecondsUntilDailyHighLowReset,
	recommendDailyCashout,
	type DailyHighLowProgressV1
} from './high-low-daily';

describe('daily High & Low payouts', () => {
	it('doubles each paying hand up to its forced cashout', () => {
		expect(calculateCashout('two-pair', 0)).toBe(200);
		expect(calculateCashout('two-pair', 6)).toBe(12_800);
		expect(calculateCashout('flush', 4)).toBe(11_200);
		expect(calculateCashout('royal-straight-flush', 0)).toBe(10_000);
		expect(calculateCashout('royal-straight-flush', 1)).toBe(20_000);
		expect(() => calculateCashout('flush', 5)).toThrow(RangeError);
	});

	it('marks the first payout above 10,000 as forced', () => {
		const options = enumerateCashoutOptions(0, 'royal-straight-flush');
		expect(options).toMatchObject([
			{ payout: 10_000, forced: false, status: 'continue' },
			{ payout: 20_000, forced: true, status: 'blocked-below-target' }
		]);
	});

	it('adds an opening subtotal and recorded payouts', () => {
		expect(
			calculateDailySubtotal(700, [
				{ handRank: 'two-pair', successfulDoubleUps: 6 },
				{ handRank: 'three-of-a-kind', successfulDoubleUps: 5 }
			])
		).toBe(19_900);
	});
});

describe('daily route recommendation', () => {
	it('uses the standard 12,800 then 6,400 route', () => {
		expect(recommendDailyCashout(0, 'two-pair')).toMatchObject({
			basis: 'progress',
			recommended: { successfulDoubleUps: 6, payout: 12_800 }
		});
		expect(recommendDailyCashout(12_800, 'two-pair')).toMatchObject({
			basis: 'universal-ready',
			recommended: {
				successfulDoubleUps: 5,
				payout: 6_400,
				subtotalAfter: 19_200
			}
		});
	});

	it('avoids ending below 30,000 when a safe stop exists', () => {
		const recommendation = recommendDailyCashout(12_800, 'two-pair');
		expect(
			recommendation.options.find((option) => option.payout === 12_800)
		).toMatchObject({
			subtotalAfter: 25_600,
			status: 'blocked-below-target'
		});
		expect(recommendation.recommended?.status).toBe('continue');
	});

	it('recognizes exact 30,000 boundaries and role-specific finales', () => {
		expect(recommendDailyCashout(18_800, 'flush')).toMatchObject({
			basis: 'finish-now',
			recommended: { payout: 11_200, subtotalAfter: 30_000 }
		});
		expect(recommendDailyCashout(17_200, 'two-pair')).toMatchObject({
			basis: 'finish-now',
			recommended: { payout: 12_800, subtotalAfter: 30_000 }
		});
		expect(recommendDailyCashout(17_600, 'two-pair')).toMatchObject({
			basis: 'finish-now',
			recommended: { payout: 12_800, subtotalAfter: 30_400 }
		});
	});

	it('stops a first royal at 10,000 instead of blocking the day at 20,000', () => {
		expect(recommendDailyCashout(0, 'royal-straight-flush')).toMatchObject({
			basis: 'progress',
			recommended: { successfulDoubleUps: 0, payout: 10_000 }
		});
		expect(recommendDailyCashout(10_000, 'royal-straight-flush')).toMatchObject(
			{
				basis: 'finish-now',
				recommended: { successfulDoubleUps: 1, payout: 20_000 }
			}
		);
	});

	it('allows 19,900 to start but closes the day at exactly 20,000', () => {
		expect(
			recommendDailyCashout(19_900, 'two-pair').recommended
		).not.toBeNull();
		expect(
			recommendDailyCashout(DAILY_HIGH_LOW_LIMIT, 'two-pair')
		).toMatchObject({ basis: 'day-closed', recommended: null, options: [] });
	});

	it('never recommends a blocked-below-target option', () => {
		for (let subtotal = 0; subtotal < DAILY_HIGH_LOW_LIMIT; subtotal += 100) {
			for (const handRank of PAYING_HAND_RANKS) {
				expect(
					recommendDailyCashout(subtotal, handRank).recommended?.status
				).not.toBe('blocked-below-target');
			}
		}
	});
});

describe('05:00 JST persistence boundary', () => {
	const beforeReset = new Date('2026-08-28T19:59:59.999Z');
	const atReset = new Date('2026-08-28T20:00:00.000Z');

	it('changes the game-day key at 05:00 JST', () => {
		expect(getDailyHighLowDayKey(beforeReset)).toBe('2026-08-28');
		expect(getDailyHighLowDayKey(atReset)).toBe('2026-08-29');
		expect(millisecondsUntilDailyHighLowReset(beforeReset)).toBe(1);
		expect(millisecondsUntilDailyHighLowReset(atReset)).toBe(86_400_000);
	});

	it('restores current data and resets data from the previous game day', () => {
		const current: DailyHighLowProgressV1 = {
			version: 1,
			dayKey: '2026-08-28',
			openingSubtotal: 12_800,
			entries: [{ handRank: 'flush', successfulDoubleUps: 0 }]
		};
		expect(
			loadDailyHighLowProgress(JSON.stringify(current), beforeReset)
		).toMatchObject({
			status: 'restored',
			progress: current
		});
		expect(
			loadDailyHighLowProgress(JSON.stringify(current), atReset)
		).toMatchObject({
			status: 'new-day',
			progress: createDailyHighLowProgress(atReset)
		});
	});

	it('discards malformed or unsupported stored state', () => {
		expect(loadDailyHighLowProgress('{', beforeReset).status).toBe('invalid');
		expect(
			loadDailyHighLowProgress(
				JSON.stringify({
					version: 2,
					dayKey: '2026-08-28',
					openingSubtotal: 0,
					entries: []
				}),
				beforeReset
			).status
		).toBe('invalid');
	});
});
