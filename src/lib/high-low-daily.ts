import {
	HAND_RANKS,
	HIGH_LOW_PAYOUT_BOUNDARY,
	PAYOUT_BY_HAND_RANK,
	highLowRoundsToBoundary,
	type HandRank
} from './high-low';

export type PayingHandRank = Exclude<HandRank, 'high-card' | 'one-pair'>;

export const PAYING_HAND_RANKS = HAND_RANKS.filter(
	(rank): rank is PayingHandRank => PAYOUT_BY_HAND_RANK[rank] > 0
);

export const DAILY_HIGH_LOW_LIMIT = 20_000;
export const DAILY_HIGH_LOW_TARGET = 30_000;
export const DAILY_HIGH_LOW_UNIVERSAL_READY_MIN = 18_800;
export const DAILY_HIGH_LOW_MAX_PREFINAL = 19_900;
export const DAILY_HIGH_LOW_RESET_HOUR_JST = 5;
export const DAILY_HIGH_LOW_LEGACY_STORAGE_KEY =
	'lab.gaato.net.holodori.high-low.daily.v1';
export const DAILY_HIGH_LOW_STORAGE_KEY =
	'lab.gaato.net.holodori.high-low.daily.v2';

export type DailyCashoutEntry = {
	kind: 'cashout';
	handRank: PayingHandRank;
	successfulDoubleUps: number;
};

export type ImportedBalanceEntry = {
	kind: 'imported-balance';
	payout: number;
};

export type DailyProgressEntry = DailyCashoutEntry | ImportedBalanceEntry;

export type DailyHighLowProgressV2 = {
	version: 2;
	dayKey: string;
	entries: DailyProgressEntry[];
};

export type CashoutStatus =
	'continue' | 'blocked-below-target' | 'target-reached';

export type CashoutOption = {
	successfulDoubleUps: number;
	payout: number;
	subtotalAfter: number;
	forced: boolean;
	status: CashoutStatus;
};

export type DailyRouteBasis =
	'finish-now' | 'universal-ready' | 'progress' | 'day-closed';

export type DailyRouteRecommendation = {
	subtotal: number;
	handRank: PayingHandRank;
	options: CashoutOption[];
	recommended: CashoutOption | null;
	basis: DailyRouteBasis;
};

export type DailyProgressLoadResult = {
	progress: DailyHighLowProgressV2;
	status: 'empty' | 'restored' | 'migrated' | 'new-day' | 'invalid';
	removeLegacyAfterSave: boolean;
};

type DailyHighLowProgressV1 = {
	version: 1;
	dayKey: string;
	openingSubtotal: number;
	entries: Array<{
		handRank: PayingHandRank;
		successfulDoubleUps: number;
	}>;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1_000;
const RESET_OFFSET_MS = DAILY_HIGH_LOW_RESET_HOUR_JST * 60 * 60 * 1_000;
const PAYING_HAND_RANK_SET = new Set<string>(PAYING_HAND_RANKS);
const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

function assertNonNegativeInteger(value: number, name: string): void {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new RangeError(`${name} must be a non-negative safe integer`);
	}
}

export function isPayingHandRank(value: unknown): value is PayingHandRank {
	return typeof value === 'string' && PAYING_HAND_RANK_SET.has(value);
}

/** Return the game-day key for the fixed 05:00 JST daily boundary. */
export function getDailyHighLowDayKey(now: Date = new Date()): string {
	if (Number.isNaN(now.getTime()))
		throw new RangeError('now must be a valid Date');
	return new Date(now.getTime() + JST_OFFSET_MS - RESET_OFFSET_MS)
		.toISOString()
		.slice(0, 10);
}

/** Milliseconds until the next 05:00 JST boundary. */
export function millisecondsUntilDailyHighLowReset(
	now: Date = new Date()
): number {
	const dayStartUtc = Date.parse(`${getDailyHighLowDayKey(now)}T00:00:00Z`);
	const nextReset =
		dayStartUtc + 24 * 60 * 60 * 1_000 - JST_OFFSET_MS + RESET_OFFSET_MS;
	return Math.max(1, nextReset - now.getTime());
}

export function createDailyHighLowProgress(
	now: Date = new Date()
): DailyHighLowProgressV2 {
	return {
		version: 2,
		dayKey: getDailyHighLowDayKey(now),
		entries: []
	};
}

export function calculateCashout(
	handRank: PayingHandRank,
	successfulDoubleUps: number
): number {
	if (!isPayingHandRank(handRank))
		throw new RangeError('handRank must pay out');
	assertNonNegativeInteger(successfulDoubleUps, 'successfulDoubleUps');
	const basePayout = PAYOUT_BY_HAND_RANK[handRank];
	const maximumDoubleUps = highLowRoundsToBoundary(basePayout);
	if (successfulDoubleUps > maximumDoubleUps) {
		throw new RangeError(
			`successfulDoubleUps must not exceed ${maximumDoubleUps} for ${handRank}`
		);
	}
	return basePayout * 2 ** successfulDoubleUps;
}

export function calculateDailyEntryPayout(entry: DailyProgressEntry): number {
	if (entry.kind === 'imported-balance') {
		assertNonNegativeInteger(entry.payout, 'payout');
		return entry.payout;
	}
	return calculateCashout(entry.handRank, entry.successfulDoubleUps);
}

export function calculateDailySubtotal(
	entries: readonly DailyProgressEntry[]
): number {
	return entries.reduce(
		(total, entry) => total + calculateDailyEntryPayout(entry),
		0
	);
}

export function enumerateCashoutOptions(
	subtotal: number,
	handRank: PayingHandRank
): CashoutOption[] {
	assertNonNegativeInteger(subtotal, 'subtotal');
	if (!isPayingHandRank(handRank))
		throw new RangeError('handRank must pay out');
	if (subtotal >= DAILY_HIGH_LOW_LIMIT) return [];

	const maximumDoubleUps = highLowRoundsToBoundary(
		PAYOUT_BY_HAND_RANK[handRank]
	);
	return Array.from(
		{ length: maximumDoubleUps + 1 },
		(_, successfulDoubleUps) => {
			const payout = calculateCashout(handRank, successfulDoubleUps);
			const subtotalAfter = subtotal + payout;
			const status: CashoutStatus =
				subtotalAfter >= DAILY_HIGH_LOW_TARGET
					? 'target-reached'
					: subtotalAfter >= DAILY_HIGH_LOW_LIMIT
						? 'blocked-below-target'
						: 'continue';
			return {
				successfulDoubleUps,
				payout,
				subtotalAfter,
				forced: payout > HIGH_LOW_PAYOUT_BOUNDARY,
				status
			};
		}
	);
}

function fewestSuccessesThenHighestSubtotal(
	left: CashoutOption,
	right: CashoutOption
): number {
	return (
		left.successfulDoubleUps - right.successfulDoubleUps ||
		right.subtotalAfter - left.subtotalAfter
	);
}

export function recommendDailyCashout(
	subtotal: number,
	handRank: PayingHandRank
): DailyRouteRecommendation {
	const options = enumerateCashoutOptions(subtotal, handRank);
	if (options.length === 0) {
		return {
			subtotal,
			handRank,
			options,
			recommended: null,
			basis: 'day-closed'
		};
	}

	const finishing = options
		.filter((option) => option.status === 'target-reached')
		.sort(fewestSuccessesThenHighestSubtotal);
	if (finishing[0]) {
		return {
			subtotal,
			handRank,
			options,
			recommended: finishing[0],
			basis: 'finish-now'
		};
	}

	const ready = options
		.filter(
			(option) =>
				option.status === 'continue' &&
				option.subtotalAfter >= DAILY_HIGH_LOW_UNIVERSAL_READY_MIN &&
				option.subtotalAfter <= DAILY_HIGH_LOW_MAX_PREFINAL
		)
		.sort(fewestSuccessesThenHighestSubtotal);
	if (ready[0]) {
		return {
			subtotal,
			handRank,
			options,
			recommended: ready[0],
			basis: 'universal-ready'
		};
	}

	const progress = options
		.filter((option) => option.status === 'continue')
		.sort(
			(left, right) =>
				right.subtotalAfter - left.subtotalAfter ||
				left.successfulDoubleUps - right.successfulDoubleUps
		);
	return {
		subtotal,
		handRank,
		options,
		recommended: progress[0] ?? null,
		basis: progress[0] ? 'progress' : 'day-closed'
	};
}

function isLegacyPayoutEntry(
	value: unknown
): value is DailyHighLowProgressV1['entries'][number] {
	if (typeof value !== 'object' || value === null) return false;
	const entry = value as Record<string, unknown>;
	if (
		!isPayingHandRank(entry.handRank) ||
		!Number.isSafeInteger(entry.successfulDoubleUps) ||
		(entry.successfulDoubleUps as number) < 0
	) {
		return false;
	}
	try {
		calculateCashout(entry.handRank, entry.successfulDoubleUps as number);
		return true;
	} catch {
		return false;
	}
}

function isDailyProgressEntry(value: unknown): value is DailyProgressEntry {
	if (typeof value !== 'object' || value === null) return false;
	const entry = value as Record<string, unknown>;
	if (entry.kind === 'cashout') return isLegacyPayoutEntry(entry);
	return (
		entry.kind === 'imported-balance' &&
		Number.isSafeInteger(entry.payout) &&
		(entry.payout as number) >= 0
	);
}

function isDailyProgressV1(value: unknown): value is DailyHighLowProgressV1 {
	if (typeof value !== 'object' || value === null) return false;
	const progress = value as Record<string, unknown>;
	return (
		progress.version === 1 &&
		typeof progress.dayKey === 'string' &&
		DAY_KEY_PATTERN.test(progress.dayKey) &&
		Number.isSafeInteger(progress.openingSubtotal) &&
		(progress.openingSubtotal as number) >= 0 &&
		Array.isArray(progress.entries) &&
		progress.entries.length <= 1_000 &&
		progress.entries.every(isLegacyPayoutEntry)
	);
}

function isDailyProgressV2(value: unknown): value is DailyHighLowProgressV2 {
	if (typeof value !== 'object' || value === null) return false;
	const progress = value as Record<string, unknown>;
	return (
		progress.version === 2 &&
		typeof progress.dayKey === 'string' &&
		DAY_KEY_PATTERN.test(progress.dayKey) &&
		Array.isArray(progress.entries) &&
		progress.entries.length <= 1_000 &&
		progress.entries.every(isDailyProgressEntry)
	);
}

function parseStoredProgress(serialized: string): unknown | null {
	try {
		return JSON.parse(serialized);
	} catch {
		return null;
	}
}

export function loadDailyHighLowProgress(
	serialized: string | null,
	legacySerialized: string | null = null,
	now: Date = new Date()
): DailyProgressLoadResult {
	const empty = createDailyHighLowProgress(now);
	if (serialized !== null) {
		const parsed = parseStoredProgress(serialized);
		if (!isDailyProgressV2(parsed)) {
			return {
				progress: empty,
				status: 'invalid',
				removeLegacyAfterSave: false
			};
		}
		if (parsed.dayKey !== empty.dayKey) {
			return {
				progress: empty,
				status: 'new-day',
				removeLegacyAfterSave: false
			};
		}
		return {
			progress: {
				version: 2,
				dayKey: parsed.dayKey,
				entries: parsed.entries.map((entry) => ({ ...entry }))
			},
			status: 'restored',
			removeLegacyAfterSave: false
		};
	}

	if (legacySerialized === null) {
		return {
			progress: empty,
			status: 'empty',
			removeLegacyAfterSave: false
		};
	}
	const legacy = parseStoredProgress(legacySerialized);
	if (!isDailyProgressV1(legacy)) {
		return {
			progress: empty,
			status: 'invalid',
			removeLegacyAfterSave: true
		};
	}
	if (legacy.dayKey !== empty.dayKey) {
		return {
			progress: empty,
			status: 'new-day',
			removeLegacyAfterSave: true
		};
	}

	const entries: DailyProgressEntry[] = [
		...(legacy.openingSubtotal > 0
			? ([
					{
						kind: 'imported-balance',
						payout: legacy.openingSubtotal
					}
				] satisfies ImportedBalanceEntry[])
			: []),
		...legacy.entries.map((entry): DailyCashoutEntry => ({
			kind: 'cashout',
			...entry
		}))
	];
	return {
		progress: {
			version: 2,
			dayKey: legacy.dayKey,
			entries
		},
		status: 'migrated',
		removeLegacyAfterSave: true
	};
}
