import { describe, expect, it } from 'vitest';

import { encodeGif, type GifOptions } from './gif';
import { lzwMinCodeSize } from './lzw';

interface ParsedFrame {
	delay: number;
	disposal: number;
	transparentFlag: number;
	transparentIndex: number;
	minCodeSize: number;
	data: Uint8Array;
}

function decodeLzw(bytes: Uint8Array, minCodeSize: number): Uint8Array {
	const clearCode = 1 << minCodeSize;
	const endCode = clearCode + 1;
	const table: Uint8Array[] = [];
	const output: number[] = [];
	let byteOffset = 0;
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
			if (byteOffset >= bytes.length)
				throw new Error('LZW stream ended before EOI');
			bits |= bytes[byteOffset++] << bitCount;
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

function parseGif(bytes: Uint8Array) {
	let offset = 0;
	const text = (length: number): string => {
		const value = new TextDecoder().decode(
			bytes.slice(offset, offset + length)
		);
		offset += length;
		return value;
	};
	const byte = (): number => bytes[offset++];
	const uint16 = (): number => byte() | (byte() << 8);
	const subBlocks = (): Uint8Array => {
		const chunks: number[] = [];
		for (let length = byte(); length !== 0; length = byte()) {
			chunks.push(...bytes.slice(offset, offset + length));
			offset += length;
		}
		return Uint8Array.from(chunks);
	};
	const magic = text(6);
	const width = uint16();
	const height = uint16();
	const packed = byte();
	const sizeBits = packed & 7;
	byte();
	byte();
	const gct = bytes.slice(offset, offset + 3 * (1 << (sizeBits + 1)));
	offset += gct.length;
	let loop: number | null = null;
	let firstImageOffset = -1;
	let netscapeOffset = -1;
	let control: Omit<ParsedFrame, 'minCodeSize' | 'data'> | null = null;
	const frames: ParsedFrame[] = [];
	let trailerAtEnd = false;
	while (offset < bytes.length) {
		const markerOffset = offset;
		const marker = byte();
		if (marker === 0x3b) {
			trailerAtEnd = offset === bytes.length;
			break;
		}
		if (marker === 0x21) {
			const label = byte();
			if (label === 0xf9) {
				expect(byte()).toBe(4);
				const gcePacked = byte();
				control = {
					delay: uint16(),
					disposal: (gcePacked >>> 2) & 7,
					transparentFlag: gcePacked & 1,
					transparentIndex: byte()
				};
				expect(byte()).toBe(0);
			} else if (label === 0xff) {
				const identifier = text(byte());
				if (identifier === 'NETSCAPE2.0') {
					netscapeOffset = markerOffset;
					expect(byte()).toBe(3);
					expect(byte()).toBe(1);
					loop = uint16();
					expect(byte()).toBe(0);
				} else {
					subBlocks();
				}
			} else {
				subBlocks();
			}
			continue;
		}
		if (marker !== 0x2c) throw new Error(`unexpected GIF marker ${marker}`);
		if (firstImageOffset < 0) firstImageOffset = markerOffset;
		offset += 8;
		const imagePacked = byte();
		if (imagePacked & 0x80) offset += 3 * (1 << ((imagePacked & 7) + 1));
		const minCodeSize = byte();
		if (control === null)
			throw new Error('image missing graphic control extension');
		frames.push({ ...control, minCodeSize, data: subBlocks() });
		control = null;
	}
	return {
		magic,
		width,
		height,
		sizeBits,
		gct,
		loop,
		frames,
		trailerAtEnd,
		netscapeBeforeFirstImage:
			netscapeOffset >= 0 && netscapeOffset < firstImageOffset
	};
}

function options(paletteSize = 4): GifOptions {
	return {
		width: 3,
		height: 2,
		palette: Uint8Array.from({ length: paletteSize * 3 }, (_, index) => index),
		paletteSize,
		transparentIndex: 0,
		loop: 0,
		frames: [
			{ indices: Uint8Array.of(0, 1, 2, 3, 2, 1), delayCentiseconds: 7 },
			{ indices: Uint8Array.of(3, 2, 1, 0, 1, 2), delayCentiseconds: 9 }
		]
	};
}

describe('GIF89a assembly', () => {
	it.each([
		[4, 1],
		[256, 7]
	])(
		'writes the screen and global palette for size %i',
		(paletteSize, sizeBits) => {
			const input = options(paletteSize);
			if (paletteSize === 256) {
				input.frames = input.frames.map((frame) => ({
					...frame,
					indices: frame.indices.map((x) => x + 20)
				}));
			}
			const parsed = parseGif(encodeGif(input));
			expect(parsed.magic).toBe('GIF89a');
			expect([parsed.width, parsed.height]).toEqual([3, 2]);
			expect(parsed.sizeBits).toBe(sizeBits);
			expect(parsed.gct).toHaveLength(paletteSize * 3);
		}
	);

	it('writes looping and frame metadata before valid image data', () => {
		const input = options();
		const parsed = parseGif(encodeGif(input));
		expect(parsed.loop).toBe(0);
		expect(parsed.netscapeBeforeFirstImage).toBe(true);
		expect(parsed.frames).toHaveLength(2);
		for (let index = 0; index < parsed.frames.length; index += 1) {
			const frame = parsed.frames[index];
			expect(frame.delay).toBe(input.frames[index].delayCentiseconds);
			expect(frame.disposal).toBe(2);
			expect(frame.transparentFlag).toBe(1);
			expect(frame.transparentIndex).toBe(0);
			expect(frame.minCodeSize).toBe(lzwMinCodeSize(input.paletteSize));
			expect(decodeLzw(frame.data, frame.minCodeSize)).toEqual(
				input.frames[index].indices
			);
		}
		expect(parsed.trailerAtEnd).toBe(true);
	});

	it('rejects malformed frame and palette sizes', () => {
		const badFrame = options();
		badFrame.frames[0].indices = Uint8Array.of(1);
		expect(() => encodeGif(badFrame)).toThrow(RangeError);
		const badPalette = options();
		badPalette.paletteSize = 3;
		badPalette.palette = new Uint8Array(9);
		expect(() => encodeGif(badPalette)).toThrow(RangeError);
	});
});
