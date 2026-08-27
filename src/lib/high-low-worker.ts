import {
	HighLowInputError,
	analyzeHand,
	type Card,
	type HandAnalysis,
	type HighLowInputErrorCode
} from './high-low';

export type HighLowWorkerRequest = {
	type: 'analyze';
	requestId: string | number;
	hand: Card[];
};

export type HighLowWorkerErrorCode =
	HighLowInputErrorCode | 'invalid_request' | 'internal';

export type HighLowWorkerResponse =
	| {
			type: 'result';
			requestId: string | number;
			result: HandAnalysis;
	  }
	| {
			type: 'error';
			requestId: string | number;
			error: {
				code: HighLowWorkerErrorCode;
				message: string;
			};
	  };

function requestIdFrom(value: unknown): string | number {
	if (
		typeof value === 'object' &&
		value !== null &&
		'requestId' in value &&
		(typeof value.requestId === 'string' || typeof value.requestId === 'number')
	) {
		return value.requestId;
	}
	return 'unknown';
}

/** Pure worker adapter, exported so message behavior can be tested in Node. */
export function processHighLowWorkerRequest(
	request: unknown
): HighLowWorkerResponse {
	const requestId = requestIdFrom(request);
	if (
		typeof request !== 'object' ||
		request === null ||
		!('type' in request) ||
		request.type !== 'analyze' ||
		!('hand' in request) ||
		!Array.isArray(request.hand)
	) {
		return {
			type: 'error',
			requestId,
			error: {
				code: 'invalid_request',
				message: 'expected an analyze request with a hand'
			}
		};
	}

	try {
		return {
			type: 'result',
			requestId,
			result: analyzeHand(request.hand as Card[])
		};
	} catch (error) {
		if (error instanceof HighLowInputError) {
			return {
				type: 'error',
				requestId,
				error: { code: error.code, message: error.message }
			};
		}
		return {
			type: 'error',
			requestId,
			error: {
				code: 'internal',
				message: 'High & Low analysis failed'
			}
		};
	}
}
