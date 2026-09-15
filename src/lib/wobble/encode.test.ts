import { describe, expect, it } from 'vitest';

import {
	animationEncoders,
	encodeGifAnimation,
	encodeJellyGif,
	jellyFrameSource,
	type FrameSource
} from './encode';
import type { WobbleSettings } from './settings';
import type { RgbaImage } from './warp';

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
		for (let index = 0; index < clearCode; index += 1)
			table[index] = Uint8Array.of(index);
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
			if (code !== nextCode || previous === undefined)
				throw new Error(`invalid LZW code ${code}`);
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

function decodedFrames(gif: Uint8Array): Uint8Array[] {
	let offset = 6;
	offset += 4;
	const packed = gif[offset++];
	offset += 2;
	offset += 3 * (1 << ((packed & 7) + 1));
	const frames: Uint8Array[] = [];
	const skipSubBlocks = (): Uint8Array => {
		const result: number[] = [];
		for (let length = gif[offset++]; length !== 0; length = gif[offset++]) {
			result.push(...gif.slice(offset, offset + length));
			offset += length;
		}
		return Uint8Array.from(result);
	};
	while (offset < gif.length && gif[offset] !== 0x3b) {
		const marker = gif[offset++];
		if (marker === 0x21) {
			const label = gif[offset++];
			if (label === 0xf9) {
				offset += 6;
			} else {
				offset += gif[offset++] + 1;
				skipSubBlocks();
			}
			continue;
		}
		if (marker !== 0x2c) throw new Error(`unexpected GIF marker ${marker}`);
		offset += 8;
		const imagePacked = gif[offset++];
		if (imagePacked & 0x80) offset += 3 * (1 << ((imagePacked & 7) + 1));
		const minCodeSize = gif[offset++];
		frames.push(decodeLzw(skipSubBlocks(), minCodeSize));
	}
	return frames;
}

function fourColourSource(): RgbaImage {
	const colours = [
		[240, 30, 20, 255],
		[20, 220, 40, 255],
		[30, 40, 230, 255],
		[240, 220, 20, 255]
	];
	const data = new Uint8ClampedArray(8 * 8 * 4);
	for (let y = 0; y < 8; y += 1) {
		for (let x = 0; x < 8; x += 1) {
			data.set(colours[(x >= 4 ? 1 : 0) + (y >= 4 ? 2 : 0)], (y * 8 + x) * 4);
		}
	}
	return { width: 8, height: 8, data };
}

function settings(amplitude: number): WobbleSettings {
	return {
		mode: 'wave',
		amplitude,
		wavelength: 16,
		cycles: 1,
		frameCount: 6,
		delayCentiseconds: 4,
		direction: 'both'
	};
}

describe('Jelly GIF encoding', () => {
	it('describes jelly frames without rendering them eagerly', () => {
		const frames = jellyFrameSource(fourColourSource(), settings(2));
		expect(frames).toMatchObject({
			width: 12,
			height: 12,
			frameCount: 6,
			delayCentiseconds: 4
		});
	});

	it('encodes frames pulled from an arbitrary frame source', () => {
		const source: FrameSource = {
			width: 2,
			height: 2,
			frameCount: 3,
			delayCentiseconds: 5,
			render(index, target) {
				const data = target ?? new Uint8ClampedArray(16);
				for (let pixel = 0; pixel < 4; pixel += 1) {
					data.set([index * 80, pixel * 60, 255 - index * 40, 255], pixel * 4);
				}
				return { width: 2, height: 2, data };
			}
		};
		expect(decodedFrames(encodeGifAnimation(source))).toHaveLength(3);
	});

	it('registers GIF metadata with its encoder', () => {
		expect(animationEncoders.gif.mimeType).toBe('image/gif');
	});

	it('renders, quantizes, and assembles all frames', () => {
		const result = encodeJellyGif(fourColourSource(), settings(2));
		expect([result.width, result.height, result.frameCount]).toEqual([
			12, 12, 6
		]);
		expect(new TextDecoder().decode(result.gif.slice(0, 6))).toBe('GIF89a');
		const frames = decodedFrames(result.gif);
		expect(frames).toHaveLength(6);
		for (const frame of frames) {
			expect(frame).toHaveLength(144);
			expect(frame[0]).toBe(0);
			expect(frame[6 * 12 + 6]).not.toBe(0);
		}
	});

	it('reports every pass and container completion in order', () => {
		const progress: Array<[number, number]> = [];
		encodeJellyGif(fourColourSource(), settings(2), (completed, total) => {
			progress.push([completed, total]);
		});
		expect(progress).toHaveLength(13);
		expect(progress.map(([completed]) => completed)).toEqual(
			Array.from({ length: 13 }, (_, index) => index + 1)
		);
		expect(progress.every(([, total]) => total === 13)).toBe(true);
	});

	it('produces identical index maps when amplitude is zero', () => {
		const frames = decodedFrames(
			encodeJellyGif(fourColourSource(), settings(0)).gif
		);
		expect(frames).toHaveLength(6);
		for (const frame of frames.slice(1)) {
			expect(frame).toEqual(frames[0]);
		}
	});
});
