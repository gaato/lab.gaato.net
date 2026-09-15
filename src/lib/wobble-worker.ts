import {
	animationEncoders,
	jellyFrameSource,
	type AnimationFormat
} from './wobble/encode';
import { withBackground, type Background } from './wobble/composite';
import {
	MAX_PIXELS_PER_JOB,
	MAX_SOURCE_EDGE,
	normalizeSettings,
	type WobbleSettings
} from './wobble/settings';
import { outputSize } from './wobble/warp';

type WorkerBackground =
	| { type: 'color'; rgb: [number, number, number] }
	| {
			type: 'image';
			width: number;
			height: number;
			pixels: ArrayBuffer;
	  };

export type JellyGifWorkerRequest = {
	type: 'encode';
	requestId: string | number;
	width: number;
	height: number;
	pixels: ArrayBuffer;
	settings: WobbleSettings;
	format?: AnimationFormat;
	background?: WorkerBackground;
};

export type JellyGifWorkerErrorCode =
	'invalid_request' | 'invalid_image' | 'image_too_large' | 'internal';

export type JellyGifWorkerProgress = {
	type: 'progress';
	requestId: string | number;
	completed: number;
	total: number;
};

export type JellyGifWorkerResponse =
	| JellyGifWorkerProgress
	| {
			type: 'result';
			requestId: string | number;
			gif: Uint8Array;
			width: number;
			height: number;
			frameCount: number;
			mimeType: string;
			extension: string;
	  }
	| {
			type: 'error';
			requestId: string | number;
			error: { code: JellyGifWorkerErrorCode; message: string };
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

function isArrayBuffer(value: unknown): value is ArrayBuffer {
	return (
		value instanceof ArrayBuffer ||
		Object.prototype.toString.call(value) === '[object ArrayBuffer]'
	);
}

function validRgb(value: unknown): value is [number, number, number] {
	return (
		Array.isArray(value) &&
		value.length === 3 &&
		value.every(
			(channel) =>
				typeof channel === 'number' &&
				Number.isInteger(channel) &&
				channel >= 0 &&
				channel <= 255
		)
	);
}

/** Pure worker adapter, exported so message behavior can be tested in Node. */
export function processJellyGifWorkerRequest(
	request: unknown,
	onProgress?: (message: JellyGifWorkerProgress) => void
): JellyGifWorkerResponse {
	const requestId = requestIdFrom(request);
	if (
		typeof request !== 'object' ||
		request === null ||
		!('type' in request) ||
		request.type !== 'encode' ||
		!('width' in request) ||
		typeof request.width !== 'number' ||
		!Number.isInteger(request.width) ||
		request.width <= 0 ||
		!('height' in request) ||
		typeof request.height !== 'number' ||
		!Number.isInteger(request.height) ||
		request.height <= 0 ||
		!('pixels' in request) ||
		!isArrayBuffer(request.pixels) ||
		!('settings' in request)
	) {
		return {
			type: 'error',
			requestId,
			error: {
				code: 'invalid_request',
				message: 'expected a valid Jelly GIF encode request'
			}
		};
	}

	const settings = normalizeSettings(request.settings);
	const format =
		!('format' in request) || request.format === undefined
			? 'gif'
			: request.format;
	if (settings === null || format !== 'gif') {
		return {
			type: 'error',
			requestId,
			error: {
				code: 'invalid_request',
				message: 'expected a valid Jelly GIF encode request'
			}
		};
	}

	const { width, height, pixels } = request;
	if (pixels.byteLength !== width * height * 4) {
		return {
			type: 'error',
			requestId,
			error: {
				code: 'invalid_image',
				message: 'pixel data does not match the image dimensions'
			}
		};
	}

	if (
		width > MAX_SOURCE_EDGE ||
		height > MAX_SOURCE_EDGE ||
		width * height * settings.frameCount > MAX_PIXELS_PER_JOB
	) {
		return {
			type: 'error',
			requestId,
			error: {
				code: 'image_too_large',
				message: 'image exceeds the Jelly GIF size limit'
			}
		};
	}

	let background: Background | undefined;
	if ('background' in request && request.background !== undefined) {
		const value = request.background;
		if (typeof value !== 'object' || value === null || !('type' in value)) {
			return {
				type: 'error',
				requestId,
				error: {
					code: 'invalid_request',
					message: 'expected a valid Jelly GIF encode request'
				}
			};
		}
		if (value.type === 'color' && 'rgb' in value && validRgb(value.rgb)) {
			background = { type: 'color', rgb: value.rgb };
		} else if (
			value.type === 'image' &&
			'width' in value &&
			typeof value.width === 'number' &&
			Number.isInteger(value.width) &&
			'height' in value &&
			typeof value.height === 'number' &&
			Number.isInteger(value.height) &&
			'pixels' in value &&
			isArrayBuffer(value.pixels)
		) {
			const expected = outputSize(
				{ width, height, data: new Uint8ClampedArray() },
				settings
			);
			if (
				value.width !== expected.width ||
				value.height !== expected.height ||
				value.pixels.byteLength !== value.width * value.height * 4
			) {
				return {
					type: 'error',
					requestId,
					error: {
						code: 'invalid_request',
						message: 'expected a valid Jelly GIF encode request'
					}
				};
			}
			background = {
				type: 'image',
				image: {
					width: value.width,
					height: value.height,
					data: new Uint8ClampedArray(value.pixels)
				}
			};
		} else {
			return {
				type: 'error',
				requestId,
				error: {
					code: 'invalid_request',
					message: 'expected a valid Jelly GIF encode request'
				}
			};
		}
	}

	try {
		const jellyFrames = jellyFrameSource(
			{ width, height, data: new Uint8ClampedArray(pixels) },
			settings
		);
		const frames = background
			? withBackground(jellyFrames, background)
			: jellyFrames;
		const { encoder, mimeType, extension } = animationEncoders[format];
		return {
			type: 'result',
			requestId,
			gif: encoder(frames, (completed, total) =>
				onProgress?.({ type: 'progress', requestId, completed, total })
			),
			width: frames.width,
			height: frames.height,
			frameCount: frames.frameCount,
			mimeType,
			extension
		};
	} catch {
		return {
			type: 'error',
			requestId,
			error: {
				code: 'internal',
				message: 'Jelly GIF encoding failed'
			}
		};
	}
}
