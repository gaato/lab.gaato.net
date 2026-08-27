import { describe, expect, it } from 'vitest';

import {
	HAND_RANKS,
	HIGH_LOW_EXPECTED_MULTIPLIERS,
	PAYOUT_BY_HAND_RANK,
	analyzeHand,
	calculateHighLowExpectedPayout,
	cardKey,
	createDeck,
	evaluateHand,
	highLowRoundsToBoundary,
	type Card,
	type Rank,
	type Suit
} from './high-low';
import { processHighLowWorkerRequest } from './high-low-worker';

const joker: Card = { kind: 'joker' };

function card(rank: Rank, suit: Suit): Card {
	return { kind: 'standard', rank, suit };
}

const S = (rank: Rank): Card => card(rank, 'spades');
const H = (rank: Rank): Card => card(rank, 'hearts');
const D = (rank: Rank): Card => card(rank, 'diamonds');
const C = (rank: Rank): Card => card(rank, 'clubs');

describe('deck and input validation', () => {
	it('creates 52 unique standard cards and one Joker', () => {
		const deck = createDeck();
		expect(deck).toHaveLength(53);
		expect(new Set(deck.map(cardKey)).size).toBe(53);
		expect(deck.filter((item) => item.kind === 'joker')).toHaveLength(1);
	});

	it('rejects the wrong hand size, malformed cards, and duplicates', () => {
		expect(() => evaluateHand([S('A')])).toThrowError(
			/hand must contain exactly 5 cards/
		);
		expect(() =>
			evaluateHand([
				S('A'),
				H('2'),
				D('3'),
				C('4'),
				{ kind: 'standard', rank: '14', suit: 'spades' } as unknown as Card
			])
		).toThrowError(/invalid suit or rank/);
		expect(() =>
			evaluateHand([S('A'), S('A'), D('3'), C('4'), H('5')])
		).toThrowError(/same card more than once/);
	});
});

describe('evaluateHand', () => {
	it.each<[string, Card[], string]>([
		['high card', [S('A'), H('3'), D('6'), C('8'), H('J')], 'high-card'],
		['one pair', [S('A'), H('A'), D('6'), C('8'), H('J')], 'one-pair'],
		['two pair', [S('A'), H('A'), D('6'), C('6'), H('J')], 'two-pair'],
		[
			'three of a kind',
			[S('A'), H('A'), D('A'), C('6'), H('J')],
			'three-of-a-kind'
		],
		['wheel straight', [S('A'), H('2'), D('3'), C('4'), H('5')], 'straight'],
		[
			'broadway straight',
			[S('10'), H('J'), D('Q'), C('K'), H('A')],
			'straight'
		],
		['flush', [S('A'), S('3'), S('6'), S('8'), S('J')], 'flush'],
		['full house', [S('A'), H('A'), D('A'), C('6'), H('6')], 'full-house'],
		[
			'four of a kind',
			[S('A'), H('A'), D('A'), C('A'), H('6')],
			'four-of-a-kind'
		],
		[
			'straight flush',
			[S('5'), S('6'), S('7'), S('8'), S('9')],
			'straight-flush'
		],
		[
			'royal straight flush',
			[S('10'), S('J'), S('Q'), S('K'), S('A')],
			'royal-straight-flush'
		],
		[
			'five of a kind',
			[S('A'), H('A'), D('A'), C('A'), joker],
			'five-of-a-kind'
		]
	])('recognizes %s', (_label, hand, expected) => {
		expect(evaluateHand(hand).rank).toBe(expected);
	});

	it.each<[string, Card[], string]>([
		[
			'a royal straight flush',
			[S('10'), S('J'), S('Q'), S('K'), joker],
			'royal-straight-flush'
		],
		[
			'a straight flush',
			[S('5'), S('6'), S('8'), S('9'), joker],
			'straight-flush'
		],
		[
			'four of a kind',
			[S('A'), H('A'), D('A'), C('6'), joker],
			'four-of-a-kind'
		],
		[
			'a full house from two pairs',
			[S('A'), H('A'), D('6'), C('6'), joker],
			'full-house'
		],
		['a flush', [S('A'), S('3'), S('6'), S('8'), joker], 'flush'],
		['a wheel straight', [S('A'), H('2'), D('3'), C('4'), joker], 'straight'],
		[
			'three of a kind from a pair',
			[S('A'), H('A'), D('6'), C('8'), joker],
			'three-of-a-kind'
		],
		[
			'one pair from four singletons',
			[S('A'), H('3'), D('6'), C('8'), joker],
			'one-pair'
		]
	])('uses the Joker to make %s', (_label, hand, expected) => {
		expect(evaluateHand(hand).rank).toBe(expected);
	});

	it('does not promote an ordinary two pair to a full house', () => {
		expect(evaluateHand([S('A'), H('A'), D('6'), C('6'), H('J')]).rank).toBe(
			'two-pair'
		);
	});

	it('exposes the current payout table', () => {
		expect(HAND_RANKS.map((rank) => PAYOUT_BY_HAND_RANK[rank])).toEqual([
			0, 0, 200, 200, 400, 700, 800, 1_500, 3_000, 7_000, 10_000
		]);
	});
});

describe('High/Low expected payout constants', () => {
	it('locks the independently reproduced exact-DP multipliers', () => {
		expect(HIGH_LOW_EXPECTED_MULTIPLIERS).toEqual([
			1.538_461_538_461_538_5, 2.277_510_821_025_805, 3.368_463_868_878_68,
			4.988_179_582_893_982, 7.385_237_415_851_301, 10.939_659_243_567_945
		]);
	});

	it.each([
		[200, 6, 2_187.931_848_713_589],
		[400, 5, 2_954.094_966_340_520_4],
		[700, 4, 3_491.725_708_025_787],
		[800, 4, 3_990.543_666_315_185_5],
		[1_500, 3, 5_052.695_803_318_02],
		[3_000, 2, 6_832.532_463_077_415],
		[7_000, 1, 10_769.230_769_230_77],
		[10_000, 1, 15_384.615_384_615_385]
	])(
		'turns a %i payout into the exact %i-round expectation',
		(payout, rounds, expected) => {
			expect(highLowRoundsToBoundary(payout)).toBe(rounds);
			expect(calculateHighLowExpectedPayout(payout)).toBeCloseTo(expected, 10);
		}
	);

	it('stops at zero or after the boundary and rejects unsupported depths', () => {
		expect(calculateHighLowExpectedPayout(0)).toBe(0);
		expect(calculateHighLowExpectedPayout(10_001)).toBe(10_001);
		expect(() => calculateHighLowExpectedPayout(100)).toThrowError(
			/no precomputed High\/Low multiplier for 7 rounds/
		);
	});
});

describe('analyzeHand', () => {
	it('enumerates all 32 hold masks and all C(53, 5) final hands exactly', () => {
		const fourToRoyal = [S('10'), S('J'), S('Q'), S('K'), H('2')];
		const analysis = analyzeHand(fourToRoyal);

		expect(analysis.strategies).toHaveLength(32);
		expect(analysis.evaluatedOutcomeCount).toBe(2_869_685);
		expect(
			analysis.bestStrategies.map((strategy) => strategy.holdMask)
		).toEqual([15]);

		const holdFour = analysis.strategies.find(
			(strategy) => strategy.holdMask === 15
		);
		expect(holdFour).toBeDefined();
		expect(holdFour).toMatchObject({
			heldIndices: [0, 1, 2, 3],
			drawCount: 1,
			outcomeCount: 48,
			payoutHitCount: 16,
			payoutHitProbability: 1 / 3,
			expectedPokerPayout: 631.25
		});
		expect(holdFour?.rankCounts).toMatchObject({
			'high-card': 20,
			'one-pair': 12,
			straight: 6,
			flush: 7,
			'straight-flush': 1,
			'royal-straight-flush': 2
		});
		expect(holdFour?.expectedFinalPayout).toBeCloseTo(
			(6 * calculateHighLowExpectedPayout(400) +
				7 * calculateHighLowExpectedPayout(700) +
				calculateHighLowExpectedPayout(3_000) +
				2 * calculateHighLowExpectedPayout(10_000)) /
				48,
			10
		);

		const wholeDeckRankCounts = Object.fromEntries(
			HAND_RANKS.map((rank) => [
				rank,
				analysis.strategies.reduce(
					(total, strategy) => total + strategy.rankCounts[rank],
					0
				)
			])
		);
		expect(wholeDeckRankCounts).toEqual({
			'high-card': 1_302_540,
			'one-pair': 1_268_088,
			'two-pair': 123_552,
			'three-of-a-kind': 137_280,
			straight: 20_532,
			flush: 7_804,
			'full-house': 6_552,
			'four-of-a-kind': 3_120,
			'straight-flush': 180,
			'five-of-a-kind': 13,
			'royal-straight-flush': 24
		});

		for (const strategy of analysis.strategies) {
			expect(
				Object.values(strategy.rankCounts).reduce(
					(total, count) => total + count,
					0
				)
			).toBe(strategy.outcomeCount);
			expect(
				Object.values(strategy.rankProbabilities).reduce(
					(total, probability) => total + probability,
					0
				)
			).toBeCloseTo(1, 12);
		}
	});

	it('keeps every exactly tied best strategy', () => {
		const analysis = analyzeHand([C('7'), C('8'), S('J'), D('5'), D('9')]);

		expect(
			analysis.bestStrategies.map((strategy) => strategy.holdMask)
		).toEqual([23, 27]);
		expect(analysis.bestStrategies[0].expectedFinalPayout).toBeCloseTo(
			analysis.bestStrategies[1].expectedFinalPayout,
			12
		);
	});

	it('ranks strategies by the High and Low-inclusive payout', () => {
		const analysis = analyzeHand([D('7'), S('J'), S('2'), H('10'), H('A')]);
		const bestImmediateStrategy = analysis.strategies.reduce(
			(best, strategy) =>
				strategy.expectedPokerPayout > best.expectedPokerPayout
					? strategy
					: best
		);

		expect(
			analysis.bestStrategies.map((strategy) => strategy.holdMask)
		).toEqual([1]);
		expect(bestImmediateStrategy.holdMask).toBe(24);
		expect(analysis.bestStrategies[0].expectedFinalPayout).toBeGreaterThan(
			bestImmediateStrategy.expectedFinalPayout
		);
		expect(bestImmediateStrategy.expectedPokerPayout).toBeGreaterThan(
			analysis.bestStrategies[0].expectedPokerPayout
		);
	});
});

describe('worker contract', () => {
	it('preserves request IDs and returns structured input errors', () => {
		expect(
			processHighLowWorkerRequest({
				type: 'analyze',
				requestId: 7,
				hand: [S('A')]
			})
		).toMatchObject({
			type: 'error',
			requestId: 7,
			error: { code: 'invalid_hand_size' }
		});

		expect(processHighLowWorkerRequest({ requestId: 'bad' })).toEqual({
			type: 'error',
			requestId: 'bad',
			error: {
				code: 'invalid_request',
				message: 'expected an analyze request with a hand'
			}
		});
	});
});
