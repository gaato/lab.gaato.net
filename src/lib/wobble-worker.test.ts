import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from './wobble/settings';
import {
	processJellyGifWorkerRequest,
	type JellyGifWorkerProgress
} from './wobble-worker';

describe('Jelly GIF worker contract', () => {
	it('rejects malformed requests and preserves available request IDs', () => {
		expect(processJellyGifWorkerRequest({ requestId: 'bad' })).toEqual({
			type: 'error',
			requestId: 'bad',
			error: {
				code: 'invalid_request',
				message: 'expected a valid Jelly GIF encode request'
			}
		});
		expect(processJellyGifWorkerRequest(null)).toMatchObject({
			type: 'error',
			requestId: 'unknown',
			error: { code: 'invalid_request' }
		});
	});

	it('rejects pixel data that does not match the dimensions', () => {
		expect(
			processJellyGifWorkerRequest({
				type: 'encode',
				requestId: 1,
				width: 4,
				height: 4,
				pixels: new ArrayBuffer(4),
				settings: DEFAULT_SETTINGS
			})
		).toMatchObject({
			type: 'error',
			requestId: 1,
			error: { code: 'invalid_image' }
		});
	});

	it('rejects an unknown animation format', () => {
		expect(
			processJellyGifWorkerRequest({
				type: 'encode',
				requestId: 'format',
				width: 1,
				height: 1,
				pixels: new ArrayBuffer(4),
				settings: DEFAULT_SETTINGS,
				format: 'bogus'
			})
		).toMatchObject({
			type: 'error',
			requestId: 'format',
			error: { code: 'invalid_request' }
		});
	});

	it('rejects images beyond the source edge limit', () => {
		expect(
			processJellyGifWorkerRequest({
				type: 'encode',
				requestId: 'large',
				width: 513,
				height: 1,
				pixels: new ArrayBuffer(513 * 4),
				settings: { ...DEFAULT_SETTINGS, frameCount: 4 }
			})
		).toMatchObject({
			type: 'error',
			requestId: 'large',
			error: { code: 'image_too_large' }
		});
	});

	it('encodes a GIF and reports increasing progress', () => {
		const pixels = new Uint8ClampedArray(4 * 4 * 4);
		for (let offset = 0; offset < pixels.length; offset += 4) {
			pixels.set([255, 0, 0, 255], offset);
		}
		const progress: JellyGifWorkerProgress[] = [];

		const response = processJellyGifWorkerRequest(
			{
				type: 'encode',
				requestId: 'encode-1',
				width: 4,
				height: 4,
				pixels: pixels.buffer,
				settings: { ...DEFAULT_SETTINGS, frameCount: 4, amplitude: 1 }
			},
			(message) => progress.push(message)
		);

		expect(response).toMatchObject({
			type: 'result',
			requestId: 'encode-1',
			width: 6,
			height: 6,
			frameCount: 4,
			mimeType: 'image/gif',
			extension: 'gif'
		});
		expect(response.type === 'result' && response.gif.slice(0, 6)).toEqual(
			new Uint8Array([71, 73, 70, 56, 57, 97])
		);
		expect(progress).toHaveLength(9);
		expect(progress.map(({ requestId }) => requestId)).toEqual(
			Array(9).fill('encode-1')
		);
		expect(progress.map(({ completed }) => completed)).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9
		]);
		expect(progress.map(({ total }) => total)).toEqual(Array(9).fill(9));
	});

	it('normalizes out-of-range settings before encoding', () => {
		const pixels = new Uint8ClampedArray(2 * 2 * 4);
		pixels.fill(255);

		expect(
			processJellyGifWorkerRequest({
				type: 'encode',
				requestId: 'normalized',
				width: 2,
				height: 2,
				pixels: pixels.buffer,
				settings: {
					...DEFAULT_SETTINGS,
					amplitude: 0,
					frameCount: 1000
				}
			})
		).toMatchObject({
			type: 'result',
			requestId: 'normalized',
			frameCount: 60
		});
	});
});
