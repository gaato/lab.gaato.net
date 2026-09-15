import { describe, expect, it } from 'vitest';

import { DEFAULT_SETTINGS } from './wobble/settings';
import {
	processJellyGifWorkerRequest,
	type JellyGifWorkerProgress
} from './wobble-worker';

function decodeLzw(bytes: Uint8Array, minCodeSize: number): Uint8Array {
	const clearCode = 1 << minCodeSize;
	const endCode = clearCode + 1;
	const table: Uint8Array[] = [];
	const output: number[] = [];
	let offset = 0;
	let bits = 0;
	let bitCount = 0;
	let codeSize = minCodeSize + 1;
	let nextCode = clearCode + 2;
	let previous: Uint8Array | undefined;
	const reset = (): void => {
		table.length = clearCode + 2;
		for (let index = 0; index < clearCode; index += 1) {
			table[index] = Uint8Array.of(index);
		}
		codeSize = minCodeSize + 1;
		nextCode = clearCode + 2;
		previous = undefined;
	};
	const readCode = (): number => {
		while (bitCount < codeSize) {
			if (offset >= bytes.length)
				throw new Error('LZW stream ended before EOI');
			bits |= bytes[offset++] << bitCount;
			bitCount += 8;
		}
		const code = bits & ((1 << codeSize) - 1);
		bits >>>= codeSize;
		bitCount -= codeSize;
		return code;
	};
	reset();
	while (true) {
		const code = readCode();
		if (code === clearCode) {
			reset();
			continue;
		}
		if (code === endCode) break;
		let current = table[code];
		if (current === undefined) {
			if (code !== nextCode || previous === undefined) {
				throw new Error(`invalid LZW code ${code}`);
			}
			current = new Uint8Array(previous.length + 1);
			current.set(previous);
			current[previous.length] = previous[0];
		}
		output.push(...current);
		if (previous !== undefined && nextCode < 4096) {
			const entry = new Uint8Array(previous.length + 1);
			entry.set(previous);
			entry[previous.length] = current[0];
			table[nextCode++] = entry;
			if (nextCode === 1 << codeSize && codeSize < 12) codeSize += 1;
		}
		previous = current;
	}
	return Uint8Array.from(output);
}

function decodeFirstFrame(gif: Uint8Array): Uint8Array {
	const packed = gif[10];
	let offset = 13 + 3 * (1 << ((packed & 7) + 1));
	const subBlocks = (): Uint8Array => {
		const data: number[] = [];
		for (let length = gif[offset++]; length !== 0; length = gif[offset++]) {
			data.push(...gif.slice(offset, offset + length));
			offset += length;
		}
		return Uint8Array.from(data);
	};
	while (offset < gif.length) {
		const marker = gif[offset++];
		if (marker === 0x21) {
			offset += 1;
			offset += gif[offset++] + 1;
			subBlocks();
			continue;
		}
		if (marker !== 0x2c) throw new Error(`unexpected GIF marker ${marker}`);
		offset += 8;
		const imagePacked = gif[offset++];
		if (imagePacked & 0x80) offset += 3 * (1 << ((imagePacked & 7) + 1));
		const minCodeSize = gif[offset++];
		return decodeLzw(subBlocks(), minCodeSize);
	}
	throw new Error('GIF contained no frame');
}

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

	it('composites a colour background into transparent margins', () => {
		const pixels = new Uint8ClampedArray(2 * 2 * 4);
		pixels.fill(255);
		const response = processJellyGifWorkerRequest({
			type: 'encode',
			requestId: 'background-color',
			width: 2,
			height: 2,
			pixels: pixels.buffer,
			settings: { ...DEFAULT_SETTINGS, amplitude: 1, frameCount: 4 },
			background: { type: 'color', rgb: [255, 0, 0] }
		});

		expect(response.type).toBe('result');
		if (response.type !== 'result') return;
		const frame = decodeFirstFrame(response.gif);
		expect(frame[0]).not.toBe(0);
		expect(frame.every((index) => index !== 0)).toBe(true);
	});

	it('rejects an image background with the wrong output size', () => {
		const pixels = new Uint8ClampedArray(2 * 2 * 4);
		expect(
			processJellyGifWorkerRequest({
				type: 'encode',
				requestId: 'background-size',
				width: 2,
				height: 2,
				pixels: pixels.buffer,
				settings: { ...DEFAULT_SETTINGS, amplitude: 1, frameCount: 4 },
				background: {
					type: 'image',
					width: 2,
					height: 2,
					pixels: new ArrayBuffer(16)
				}
			})
		).toMatchObject({
			type: 'error',
			requestId: 'background-size',
			error: { code: 'invalid_request' }
		});
	});
});
