import { describe, expect, it } from 'vitest';

import { ByteWriter, encodeLzw, lzwMinCodeSize, writeSubBlocks } from './lzw';

interface TracedCode {
	code: number;
	width: number;
}

interface DecodedLzw {
	indices: Uint8Array;
	codes: TracedCode[];
	clearCount: number;
}

function decodeLzw(bytes: Uint8Array, minCodeSize: number): DecodedLzw {
	const clearCode = 1 << minCodeSize;
	const endCode = clearCode + 1;
	const table: Uint8Array[] = [];
	const output: number[] = [];
	const codes: TracedCode[] = [];
	let byteOffset = 0;
	let bits = 0;
	let bitCount = 0;
	let codeSize = minCodeSize + 1;
	let nextCode = clearCode + 2;
	let previous: Uint8Array | undefined;
	let clearCount = 0;

	const reset = (): void => {
		table.length = clearCode + 2;
		for (let index = 0; index < clearCode; index += 1) {
			table[index] = Uint8Array.of(index);
		}
		codeSize = minCodeSize + 1;
		nextCode = clearCode + 2;
		previous = undefined;
	};

	const readCode = (): number | undefined => {
		while (bitCount < codeSize) {
			if (byteOffset >= bytes.length) {
				return undefined;
			}
			bits |= bytes[byteOffset] << bitCount;
			byteOffset += 1;
			bitCount += 8;
		}
		const code = bits & ((1 << codeSize) - 1);
		bits >>>= codeSize;
		bitCount -= codeSize;
		return code;
	};

	reset();
	while (true) {
		const width = codeSize;
		const code = readCode();
		if (code === undefined) {
			throw new Error('LZW stream ended before EOI');
		}
		codes.push({ code, width });

		if (code === clearCode) {
			clearCount += 1;
			reset();
			continue;
		}
		if (code === endCode) {
			break;
		}

		let current = table[code];
		if (current === undefined) {
			if (code !== nextCode || previous === undefined) {
				throw new Error(`invalid LZW code ${code}`);
			}
			current = new Uint8Array(previous.length + 1);
			current.set(previous);
			current[previous.length] = previous[0];
		}
		for (const value of current) {
			output.push(value);
		}

		if (previous !== undefined && nextCode < 4096) {
			const entry = new Uint8Array(previous.length + 1);
			entry.set(previous);
			entry[previous.length] = current[0];
			table[nextCode] = entry;
			nextCode += 1;
			if (nextCode === 1 << codeSize && codeSize < 12) {
				codeSize += 1;
			}
		}
		previous = current;
	}

	return { indices: Uint8Array.from(output), codes, clearCount };
}

function noise(length: number, seed: number): Uint8Array {
	const values = new Uint8Array(length);
	let state = seed >>> 0;
	for (let index = 0; index < values.length; index += 1) {
		state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
		values[index] = state >>> 24;
	}
	return values;
}

describe('GIF LZW encoding', () => {
	it('decodes the Wikipedia GIF sample and round-trips it compactly', () => {
		const sample = Uint8Array.from([
			0x00, 0x51, 0xfc, 0x1b, 0x28, 0x70, 0xa0, 0xc1, 0x83, 0x01, 0x01
		]);
		const expected = Uint8Array.from([
			0x28, 0xff, 0xff, 0xff, 0x28, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
			0xff, 0xff, 0xff
		]);
		const decoded = decodeLzw(sample, 8);
		expect(decoded.indices).toEqual(expected);
		expect(decoded.codes.map(({ code }) => code)).toEqual([
			0x100, 0x028, 0x0ff, 0x103, 0x102, 0x103, 0x106, 0x107, 0x101
		]);
		expect(decoded.codes.every(({ width }) => width === 9)).toBe(true);

		const encoded = encodeLzw(expected, 8);
		expect(decodeLzw(encoded, 8).indices).toEqual(expected);
		expect(encoded.length).toBeLessThanOrEqual(11);
	});

	it.each([
		[2, 2],
		[3, 2],
		[4, 2],
		[5, 3],
		[16, 4],
		[17, 5],
		[256, 8]
	])(
		'chooses code size %i for a palette of %i entries',
		(paletteSize, size) => {
			expect(lzwMinCodeSize(paletteSize)).toBe(size);
		}
	);

	it('round-trips a flat image', () => {
		const indices = new Uint8Array(1000).fill(3);
		expect(decodeLzw(encodeLzw(indices, 2), 2).indices).toEqual(indices);
	});

	it('round-trips an 8 by 8 checkerboard', () => {
		const indices = Uint8Array.from(
			{ length: 64 },
			(_, index) => ((index >>> 3) + index) & 1
		);
		expect(decodeLzw(encodeLzw(indices, 2), 2).indices).toEqual(indices);
	});

	it('reaches 12 bits and clears while round-tripping 64 by 64 noise', () => {
		const indices = noise(64 * 64, 0x5eed1234);
		const decoded = decodeLzw(encodeLzw(indices, 8), 8);
		expect(decoded.indices).toEqual(indices);
		expect(
			decoded.codes.some(({ code, width }) => code === 0x100 && width === 12)
		).toBe(true);
		expect(decoded.clearCount).toBeGreaterThan(1);
	});

	it('round-trips 300 by 300 noise through multiple table clears', () => {
		const indices = noise(300 * 300, 0xc0ffee);
		const decoded = decodeLzw(encodeLzw(indices, 8), 8);
		expect(decoded.indices).toEqual(indices);
		expect(decoded.clearCount).toBeGreaterThan(2);
	});

	it('round-trips a run-heavy four-colour image', () => {
		const indices = Uint8Array.from(
			{ length: 100 * 100 },
			(_, index) => (Math.floor(index / 125) + Math.floor(index / 2500)) & 3
		);
		expect(decodeLzw(encodeLzw(indices, 2), 2).indices).toEqual(indices);
	});

	it('starts with CLEAR and ends with EOI', () => {
		const decoded = decodeLzw(encodeLzw(Uint8Array.of(0, 1, 2, 3), 2), 2);
		expect(decoded.codes[0].code).toBe(4);
		expect(decoded.codes.at(-1)?.code).toBe(5);
	});

	it('encodes empty input as exactly CLEAR followed by EOI', () => {
		const encoded = encodeLzw(new Uint8Array(), 2);
		const decoded = decodeLzw(encoded, 2);
		expect(encoded).toEqual(Uint8Array.of(0x2c));
		expect(decoded.indices).toEqual(new Uint8Array());
		expect(decoded.codes).toEqual([
			{ code: 4, width: 3 },
			{ code: 5, width: 3 }
		]);
	});

	it('rejects invalid code sizes and palette indices', () => {
		expect(() => encodeLzw(Uint8Array.of(4), 2)).toThrow(RangeError);
		expect(() => encodeLzw(Uint8Array.of(0), 1)).toThrow(RangeError);
	});
});

describe('GIF byte writing', () => {
	it('writes 16-bit values in little-endian order', () => {
		const writer = new ByteWriter();
		writer.writeUint16LE(0x1234);
		expect(writer.length).toBe(2);
		expect(writer.toUint8Array()).toEqual(Uint8Array.of(0x34, 0x12));
	});

	it.each([
		[1000, [255, 255, 255, 235]],
		[255, [255]],
		[0, []]
	] as const)('splits %i bytes into GIF sub-blocks', (length, chunkLengths) => {
		const bytes = Uint8Array.from({ length }, (_, index) => index);
		const writer = new ByteWriter();
		writeSubBlocks(writer, bytes);
		const result = writer.toUint8Array();
		let offset = 0;
		const actualLengths: number[] = [];
		while (result[offset] !== 0) {
			const chunkLength = result[offset];
			actualLengths.push(chunkLength);
			offset += chunkLength + 1;
		}

		expect(actualLengths).toEqual(chunkLengths);
		expect(offset).toBe(result.length - 1);
		expect(result.length).toBe(length + chunkLengths.length + 1);
		expect(result.at(-1)).toBe(0);
	});
});
