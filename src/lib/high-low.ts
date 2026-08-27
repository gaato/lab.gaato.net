export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;
export const RANKS = [
	'A',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',
	'10',
	'J',
	'Q',
	'K'
] as const;

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export type StandardCard = {
	kind: 'standard';
	suit: Suit;
	rank: Rank;
};

export type JokerCard = {
	kind: 'joker';
};

export type Card = StandardCard | JokerCard;

/** Display order from a losing hand through the highest current payout. */
export const HAND_RANKS = [
	'high-card',
	'one-pair',
	'two-pair',
	'three-of-a-kind',
	'straight',
	'flush',
	'full-house',
	'four-of-a-kind',
	'straight-flush',
	'five-of-a-kind',
	'royal-straight-flush'
] as const;

export type HandRank = (typeof HAND_RANKS)[number];

/** Current Card of Greed payout after the version 1.0.100 increase. */
export const PAYOUT_BY_HAND_RANK: Readonly<Record<HandRank, number>> = {
	'high-card': 0,
	'one-pair': 0,
	'two-pair': 200,
	'three-of-a-kind': 200,
	straight: 400,
	flush: 700,
	'full-house': 800,
	'four-of-a-kind': 1_500,
	'straight-flush': 3_000,
	'five-of-a-kind': 7_000,
	'royal-straight-flush': 10_000
};

export const HIGH_LOW_PAYOUT_BOUNDARY = 10_000;

/**
 * Expected stake multipliers for one through six successful double-up rounds.
 *
 * These constants were generated offline from the exact 52-card, no-replacement
 * state `(remaining rank counts, face-up rank, rounds left)`. Equal cards are
 * consumed and redrawn; Ace is high; every state chooses the best of stopping,
 * High, and Low. Two independent dynamic-programming implementations produced
 * the same values. Keeping this table avoids roughly 10.3 million states and
 * hundreds of MiB of memory in a browser worker.
 */
export const HIGH_LOW_EXPECTED_MULTIPLIERS = [
	1.538_461_538_461_538_5, 2.277_510_821_025_805, 3.368_463_868_878_68,
	4.988_179_582_893_982, 7.385_237_415_851_301, 10.939_659_243_567_945
] as const;

export type HandEvaluation = {
	rank: HandRank;
	payout: number;
	highLowRounds: number;
	expectedFinalPayout: number;
};

export type HoldStrategy = {
	holdMask: number;
	heldIndices: number[];
	drawCount: number;
	outcomeCount: number;
	rankCounts: Record<HandRank, number>;
	rankProbabilities: Record<HandRank, number>;
	payoutHitCount: number;
	payoutHitProbability: number;
	expectedPokerPayout: number;
	expectedFinalPayout: number;
};

export type HandAnalysis = {
	hand: Card[];
	initial: HandEvaluation;
	strategies: HoldStrategy[];
	bestStrategies: HoldStrategy[];
	evaluatedOutcomeCount: number;
};

export type HighLowInputErrorCode =
	'invalid_hand_size' | 'invalid_card' | 'duplicate_card';

export class HighLowInputError extends Error {
	readonly code: HighLowInputErrorCode;

	constructor(code: HighLowInputErrorCode, message: string) {
		super(message);
		this.name = 'HighLowInputError';
		this.code = code;
	}
}

const JOKER_ID = 52;
const DECK_SIZE = 53;
const HAND_SIZE = 5;
const STRATEGY_COUNT = 1 << HAND_SIZE;
const BEST_STRATEGY_EPSILON = 1e-9;
const HIGH_CARD_INDEX = 0;
const ONE_PAIR_INDEX = 1;
const TWO_PAIR_INDEX = 2;
const THREE_OF_A_KIND_INDEX = 3;
const STRAIGHT_INDEX = 4;
const FLUSH_INDEX = 5;
const FULL_HOUSE_INDEX = 6;
const FOUR_OF_A_KIND_INDEX = 7;
const STRAIGHT_FLUSH_INDEX = 8;
const FIVE_OF_A_KIND_INDEX = 9;
const ROYAL_STRAIGHT_FLUSH_INDEX = 10;

const SUIT_INDEX = new Map<Suit, number>(
	SUITS.map((suit, index) => [suit, index])
);
const RANK_INDEX = new Map<Rank, number>(
	RANKS.map((rank, index) => [rank, index])
);

const PAYOUT_BY_RANK_INDEX = HAND_RANKS.map(
	(rank) => PAYOUT_BY_HAND_RANK[rank]
);
const HIGH_LOW_EXPECTED_PAYOUT_BY_RANK_INDEX = HAND_RANKS.map((rank) =>
	calculateHighLowExpectedPayout(PAYOUT_BY_HAND_RANK[rank])
);

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function encodeCard(card: unknown, index?: number): number {
	const location = index === undefined ? 'card' : `card at index ${index}`;
	if (!isRecord(card)) {
		throw new HighLowInputError('invalid_card', `${location} is not a card`);
	}

	if (card.kind === 'joker') return JOKER_ID;
	if (card.kind !== 'standard') {
		throw new HighLowInputError(
			'invalid_card',
			`${location} has an invalid kind`
		);
	}

	const suit = SUIT_INDEX.get(card.suit as Suit);
	const rank = RANK_INDEX.get(card.rank as Rank);
	if (suit === undefined || rank === undefined) {
		throw new HighLowInputError(
			'invalid_card',
			`${location} has an invalid suit or rank`
		);
	}

	return suit * RANKS.length + rank;
}

function decodeCard(cardId: number): Card {
	if (cardId === JOKER_ID) return { kind: 'joker' };
	return {
		kind: 'standard',
		suit: SUITS[Math.floor(cardId / RANKS.length)],
		rank: RANKS[cardId % RANKS.length]
	};
}

function encodeHand(hand: readonly Card[]): number[] {
	if (!Array.isArray(hand) || hand.length !== HAND_SIZE) {
		throw new HighLowInputError(
			'invalid_hand_size',
			`hand must contain exactly ${HAND_SIZE} cards`
		);
	}

	const encoded = hand.map((card, index) => encodeCard(card, index));
	if (new Set(encoded).size !== encoded.length) {
		throw new HighLowInputError(
			'duplicate_card',
			'hand contains the same card more than once'
		);
	}
	return encoded;
}

/** A stable identifier suitable for duplicate checks and URL state. */
export function cardKey(card: Card): string {
	const cardId = encodeCard(card);
	return cardId === JOKER_ID ? 'joker' : String(cardId);
}

/** Return a fresh 52-card deck followed by the single Joker. */
export function createDeck(): Card[] {
	return Array.from({ length: DECK_SIZE }, (_, cardId) => decodeCard(cardId));
}

/** Number of successful double-up rounds needed to cross the one-game cap. */
export function highLowRoundsToBoundary(payout: number): number {
	if (!Number.isFinite(payout) || payout < 0) {
		throw new RangeError('payout must be a non-negative finite number');
	}
	if (payout === 0 || payout > HIGH_LOW_PAYOUT_BOUNDARY) return 0;

	let rounds = 0;
	let doubled = payout;
	while (doubled <= HIGH_LOW_PAYOUT_BOUNDARY) {
		doubled *= 2;
		rounds += 1;
	}
	return rounds;
}

/**
 * Expected final payout when High/Low is played optimally until its one-game
 * boundary. Runtime calculations use the precomputed exact-DP multipliers.
 */
export function calculateHighLowExpectedPayout(payout: number): number {
	const rounds = highLowRoundsToBoundary(payout);
	if (rounds === 0) return payout;
	const multiplier = HIGH_LOW_EXPECTED_MULTIPLIERS[rounds - 1];
	if (multiplier === undefined) {
		throw new RangeError(
			`no precomputed High/Low multiplier for ${rounds} rounds`
		);
	}
	return payout * multiplier;
}

type EvaluationWorkspace = {
	rankCounts: Uint8Array;
	suitCounts: Uint8Array;
};

function createEvaluationWorkspace(): EvaluationWorkspace {
	return {
		rankCounts: new Uint8Array(14),
		suitCounts: new Uint8Array(SUITS.length)
	};
}

/** Return the high card of a straight, with Ace represented as 14. */
function findStraightHigh(rankCounts: Uint8Array, jokers: number): number {
	for (let high = 14; high >= 5; high -= 1) {
		let missing = 0;
		for (let offset = 0; offset < HAND_SIZE; offset += 1) {
			let rank = high - offset;
			if (rank === 14) rank = 1;
			if (rankCounts[rank] === 0) missing += 1;
		}
		if (missing <= jokers) return high;
	}
	return 0;
}

function evaluateEncodedHand(
	cards: ArrayLike<number>,
	workspace: EvaluationWorkspace
): number {
	const { rankCounts, suitCounts } = workspace;
	rankCounts.fill(0);
	suitCounts.fill(0);

	let jokers = 0;
	let maxRankCount = 0;
	for (let index = 0; index < HAND_SIZE; index += 1) {
		const cardId = cards[index];
		if (cardId === JOKER_ID) {
			jokers += 1;
			continue;
		}
		const rank = (cardId % RANKS.length) + 1;
		const suit = Math.floor(cardId / RANKS.length);
		rankCounts[rank] += 1;
		suitCounts[suit] += 1;
		if (rankCounts[rank] > maxRankCount) {
			maxRankCount = rankCounts[rank];
		}
	}

	let pairCount = 0;
	let hasThree = false;
	for (let rank = 1; rank <= RANKS.length; rank += 1) {
		if (rankCounts[rank] === 2) pairCount += 1;
		if (rankCounts[rank] === 3) hasThree = true;
	}

	if (jokers === 1 && maxRankCount === 4) {
		return FIVE_OF_A_KIND_INDEX;
	}

	const nonJokerCount = HAND_SIZE - jokers;
	let isFlush = false;
	for (let suit = 0; suit < SUITS.length; suit += 1) {
		if (suitCounts[suit] === nonJokerCount) {
			isFlush = true;
			break;
		}
	}
	const straightHigh = findStraightHigh(rankCounts, jokers);
	if (isFlush && straightHigh === 14) {
		return ROYAL_STRAIGHT_FLUSH_INDEX;
	}
	if (isFlush && straightHigh !== 0) {
		return STRAIGHT_FLUSH_INDEX;
	}
	if (maxRankCount + jokers >= 4) {
		return FOUR_OF_A_KIND_INDEX;
	}
	if (
		(jokers === 0 && hasThree && pairCount === 1) ||
		(jokers === 1 && pairCount >= 2)
	) {
		return FULL_HOUSE_INDEX;
	}
	if (isFlush) return FLUSH_INDEX;
	if (straightHigh !== 0) return STRAIGHT_INDEX;
	if (maxRankCount + jokers >= 3) {
		return THREE_OF_A_KIND_INDEX;
	}
	if (pairCount >= 2) return TWO_PAIR_INDEX;
	if (maxRankCount + jokers >= 2) {
		return ONE_PAIR_INDEX;
	}
	return HIGH_CARD_INDEX;
}

/** Evaluate one complete five-card poker hand. */
export function evaluateHand(hand: readonly Card[]): HandEvaluation {
	const encoded = encodeHand(hand);
	const rankIndex = evaluateEncodedHand(encoded, createEvaluationWorkspace());
	const rank = HAND_RANKS[rankIndex];
	const payout = PAYOUT_BY_RANK_INDEX[rankIndex];
	return {
		rank,
		payout,
		highLowRounds: highLowRoundsToBoundary(payout),
		expectedFinalPayout: HIGH_LOW_EXPECTED_PAYOUT_BY_RANK_INDEX[rankIndex]
	};
}

function emptyRankRecord(): Record<HandRank, number> {
	return Object.fromEntries(HAND_RANKS.map((rank) => [rank, 0])) as Record<
		HandRank,
		number
	>;
}

function choose(n: number, k: number): number {
	if (k < 0 || k > n) return 0;
	let result = 1;
	for (let index = 1; index <= Math.min(k, n - k); index += 1) {
		result = (result * (n - index + 1)) / index;
	}
	return result;
}

function countBits(value: number): number {
	let count = 0;
	while (value !== 0) {
		value &= value - 1;
		count += 1;
	}
	return count;
}

function enumerateDrawCombinations(
	deck: readonly number[],
	drawCount: number,
	handBuffer: Int16Array,
	handOffset: number,
	onHand: () => void
): void {
	if (drawCount === 0) {
		onHand();
		return;
	}

	const visit = (depth: number, start: number): void => {
		if (depth === drawCount) {
			onHand();
			return;
		}

		const cardsStillNeeded = drawCount - depth;
		const finalStart = deck.length - cardsStillNeeded;
		for (let index = start; index <= finalStart; index += 1) {
			handBuffer[handOffset + depth] = deck[index];
			visit(depth + 1, index + 1);
		}
	};

	visit(0, 0);
}

function analyzeStrategy(
	holdMask: number,
	encodedHand: readonly number[],
	remainingDeck: readonly number[],
	workspace: EvaluationWorkspace
): HoldStrategy {
	const heldIndices: number[] = [];
	const handBuffer = new Int16Array(HAND_SIZE);
	let heldCount = 0;
	for (let index = 0; index < HAND_SIZE; index += 1) {
		if ((holdMask & (1 << index)) !== 0) {
			heldIndices.push(index);
			handBuffer[heldCount] = encodedHand[index];
			heldCount += 1;
		}
	}

	const drawCount = HAND_SIZE - heldCount;
	const outcomeCount = choose(remainingDeck.length, drawCount);
	const rankCounts = new Array<number>(HAND_RANKS.length).fill(0);
	let pokerPayoutTotal = 0;
	let finalPayoutTotal = 0;
	let payoutHitCount = 0;

	enumerateDrawCombinations(
		remainingDeck,
		drawCount,
		handBuffer,
		heldCount,
		() => {
			const rankIndex = evaluateEncodedHand(handBuffer, workspace);
			rankCounts[rankIndex] += 1;
			const payout = PAYOUT_BY_RANK_INDEX[rankIndex];
			pokerPayoutTotal += payout;
			finalPayoutTotal += HIGH_LOW_EXPECTED_PAYOUT_BY_RANK_INDEX[rankIndex];
			if (payout > 0) payoutHitCount += 1;
		}
	);

	const rankCountRecord = emptyRankRecord();
	const rankProbabilities = emptyRankRecord();
	for (let index = 0; index < HAND_RANKS.length; index += 1) {
		const rank = HAND_RANKS[index];
		rankCountRecord[rank] = rankCounts[index];
		rankProbabilities[rank] = rankCounts[index] / outcomeCount;
	}

	return {
		holdMask,
		heldIndices,
		drawCount,
		outcomeCount,
		rankCounts: rankCountRecord,
		rankProbabilities,
		payoutHitCount,
		payoutHitProbability: payoutHitCount / outcomeCount,
		expectedPokerPayout: pokerPayoutTotal / outcomeCount,
		expectedFinalPayout: finalPayoutTotal / outcomeCount
	};
}

function compareStrategies(left: HoldStrategy, right: HoldStrategy): number {
	return (
		right.expectedFinalPayout - left.expectedFinalPayout ||
		right.expectedPokerPayout - left.expectedPokerPayout ||
		right.payoutHitProbability - left.payoutHitProbability ||
		right.heldIndices.length - left.heldIndices.length ||
		left.holdMask - right.holdMask
	);
}

/**
 * Evaluate every one of the 32 possible hold masks exactly.
 *
 * The five initially dealt cards are removed before replacement cards are
 * drawn. Across the 32 masks this visits C(53, 5) = 2,869,685 final hands.
 */
export function analyzeHand(hand: readonly Card[]): HandAnalysis {
	const encodedHand = encodeHand(hand);
	const initialRankIndex = evaluateEncodedHand(
		encodedHand,
		createEvaluationWorkspace()
	);
	const initialRank = HAND_RANKS[initialRankIndex];
	const initialPayout = PAYOUT_BY_RANK_INDEX[initialRankIndex];

	const initialCardIds = new Set(encodedHand);
	const remainingDeck: number[] = [];
	for (let cardId = 0; cardId < DECK_SIZE; cardId += 1) {
		if (!initialCardIds.has(cardId)) remainingDeck.push(cardId);
	}

	const workspace = createEvaluationWorkspace();
	const strategies: HoldStrategy[] = [];
	for (let holdMask = 0; holdMask < STRATEGY_COUNT; holdMask += 1) {
		strategies.push(
			analyzeStrategy(holdMask, encodedHand, remainingDeck, workspace)
		);
	}
	strategies.sort(compareStrategies);

	const bestExpectedPayout = strategies[0].expectedFinalPayout;
	const bestStrategies = strategies.filter(
		(strategy) =>
			Math.abs(strategy.expectedFinalPayout - bestExpectedPayout) <=
			BEST_STRATEGY_EPSILON
	);

	return {
		hand: encodedHand.map(decodeCard),
		initial: {
			rank: initialRank,
			payout: initialPayout,
			highLowRounds: highLowRoundsToBoundary(initialPayout),
			expectedFinalPayout:
				HIGH_LOW_EXPECTED_PAYOUT_BY_RANK_INDEX[initialRankIndex]
		},
		strategies,
		bestStrategies,
		evaluatedOutcomeCount: strategies.reduce(
			(total, strategy) => total + strategy.outcomeCount,
			0
		)
	};
}
