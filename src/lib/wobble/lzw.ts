export class ByteWriter {
	private buffer = new Uint8Array(256);
	private used = 0;

	private ensureCapacity(additionalBytes: number): void {
		const required = this.used + additionalBytes;
		if (required <= this.buffer.length) {
			return;
		}

		let capacity = this.buffer.length;
		while (capacity < required) {
			capacity *= 2;
		}
		const grown = new Uint8Array(capacity);
		grown.set(this.buffer);
		this.buffer = grown;
	}

	writeByte(value: number): void {
		this.ensureCapacity(1);
		this.buffer[this.used] = value;
		this.used += 1;
	}

	writeBytes(bytes: ArrayLike<number>): void {
		this.ensureCapacity(bytes.length);
		for (let index = 0; index < bytes.length; index += 1) {
			this.buffer[this.used + index] = bytes[index];
		}
		this.used += bytes.length;
	}

	writeUint16LE(value: number): void {
		this.ensureCapacity(2);
		this.buffer[this.used] = value;
		this.buffer[this.used + 1] = value >>> 8;
		this.used += 2;
	}

	toUint8Array(): Uint8Array {
		return this.buffer.slice(0, this.used);
	}

	get length(): number {
		return this.used;
	}
}

export function lzwMinCodeSize(paletteSize: number): number {
	if (!Number.isInteger(paletteSize) || paletteSize < 2 || paletteSize > 256) {
		throw new RangeError('paletteSize must be an integer from 2 through 256');
	}
	return Math.max(2, Math.ceil(Math.log2(paletteSize)));
}

export function encodeLzw(
	indices: Uint8Array,
	minCodeSize: number
): Uint8Array {
	if (!Number.isInteger(minCodeSize) || minCodeSize < 2 || minCodeSize > 8) {
		throw new RangeError('minCodeSize must be an integer from 2 through 8');
	}

	const clearCode = 1 << minCodeSize;
	const endCode = clearCode + 1;
	for (const index of indices) {
		if (index >= clearCode) {
			throw new RangeError(`palette index ${index} exceeds the code table`);
		}
	}

	const output = new ByteWriter();
	let bits = 0;
	let bitCount = 0;
	let codeSize = minCodeSize + 1;
	let nextCode = clearCode + 2;

	const writeCode = (code: number): void => {
		bits |= code << bitCount;
		bitCount += codeSize;
		while (bitCount >= 8) {
			output.writeByte(bits & 0xff);
			bits >>>= 8;
			bitCount -= 8;
		}
	};

	writeCode(clearCode);
	if (indices.length === 0) {
		writeCode(endCode);
		if (bitCount > 0) {
			output.writeByte(bits & 0xff);
		}
		return output.toUint8Array();
	}

	const dictionary = new Map<number, number>();
	let current = indices[0];
	for (let index = 1; index < indices.length; index += 1) {
		const suffix = indices[index];
		const key = (current << 8) | suffix;
		const combined = dictionary.get(key);
		if (combined !== undefined) {
			current = combined;
			continue;
		}

		writeCode(current);

		// The decoder creates this entry only after reading the following code.
		// Delay the packing-width change by one emitted code to keep that reader
		// synchronized, then use the wider width for subsequent codes.
		if (nextCode === 1 << codeSize && codeSize < 12) {
			codeSize += 1;
		}

		dictionary.set(key, nextCode);
		nextCode += 1;
		if (nextCode === 4096) {
			// current was emitted above. Clear at 12 bits and restart from suffix;
			// the just-added code 4095 is intentionally never referenced.
			writeCode(clearCode);
			dictionary.clear();
			codeSize = minCodeSize + 1;
			nextCode = clearCode + 2;
		}
		current = suffix;
	}

	writeCode(current);
	writeCode(endCode);
	if (bitCount > 0) {
		output.writeByte(bits & 0xff);
	}
	return output.toUint8Array();
}

export function writeSubBlocks(out: ByteWriter, bytes: Uint8Array): void {
	for (let offset = 0; offset < bytes.length; offset += 255) {
		const length = Math.min(255, bytes.length - offset);
		out.writeByte(length);
		out.writeBytes(bytes.subarray(offset, offset + length));
	}
	out.writeByte(0);
}
