const textEncoder = new TextEncoder();

export class ByteReader {
	readonly bytes: Uint8Array;
	readonly view: DataView;
	offset = 0;

	constructor(bytes: Uint8Array) {
		this.bytes = bytes;
		this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	}

	get remaining(): number {
		return this.bytes.length - this.offset;
	}

	seek(offset: number): this {
		if (!Number.isInteger(offset) || offset < 0 || offset > this.bytes.length)
			throw new RangeError('byte offset is outside the buffer');
		this.offset = offset;
		return this;
	}

	skip(length: number): this {
		return this.seek(this.offset + length);
	}

	u8(): number {
		this.require(1);
		return this.view.getUint8(this.offset++);
	}

	u16(): number {
		this.require(2);
		const value = this.view.getUint16(this.offset);
		this.offset += 2;
		return value;
	}

	u24(): number {
		return this.u8() * 0x10000 + this.u16();
	}

	u32(): number {
		this.require(4);
		const value = this.view.getUint32(this.offset);
		this.offset += 4;
		return value;
	}

	u64(): number {
		const high = this.u32();
		const low = this.u32();
		const value = high * 0x1_0000_0000 + low;
		if (!Number.isSafeInteger(value))
			throw new RangeError(
				'64-bit integer exceeds JavaScript safe integer range'
			);
		return value;
	}

	i64(): number {
		this.require(8);
		const value = this.view.getBigInt64(this.offset);
		this.offset += 8;
		const number = Number(value);
		if (!Number.isSafeInteger(number))
			throw new RangeError(
				'64-bit integer exceeds JavaScript safe integer range'
			);
		return number;
	}

	i16(): number {
		this.require(2);
		const value = this.view.getInt16(this.offset);
		this.offset += 2;
		return value;
	}

	i32(): number {
		this.require(4);
		const value = this.view.getInt32(this.offset);
		this.offset += 4;
		return value;
	}

	fixed16_16(): number {
		return this.i32() / 0x10000;
	}

	fixed2_30(): number {
		return this.i32() / 0x4000_0000;
	}

	f32(): number {
		this.require(4);
		const value = this.view.getFloat32(this.offset);
		this.offset += 4;
		return value;
	}

	f64(): number {
		this.require(8);
		const value = this.view.getFloat64(this.offset);
		this.offset += 8;
		return value;
	}

	fourcc(): string {
		this.require(4);
		const value = String.fromCharCode(
			...this.bytes.subarray(this.offset, this.offset + 4)
		);
		this.offset += 4;
		return value;
	}

	read(length: number): Uint8Array {
		this.require(length);
		const value = this.bytes.subarray(this.offset, this.offset + length);
		this.offset += length;
		return value;
	}

	subReader(length: number): ByteReader {
		return new ByteReader(this.read(length));
	}

	private require(length: number): void {
		if (
			!Number.isInteger(length) ||
			length < 0 ||
			this.offset + length > this.bytes.length
		)
			throw new RangeError('unexpected end of byte buffer');
	}
}

export type BoxBody = (writer: ByteWriter) => void;

export class ByteWriter {
	private storage: Uint8Array;
	private view: DataView;
	length = 0;

	constructor(initialCapacity = 256) {
		this.storage = new Uint8Array(Math.max(1, initialCapacity));
		this.view = new DataView(this.storage.buffer);
	}

	u8(value: number): this {
		this.ensure(1);
		this.view.setUint8(this.length++, value);
		return this;
	}

	u16(value: number): this {
		this.ensure(2);
		this.view.setUint16(this.length, value);
		this.length += 2;
		return this;
	}

	u24(value: number): this {
		return this.u8(value >>> 16).u16(value);
	}

	u32(value: number): this {
		this.ensure(4);
		this.view.setUint32(this.length, value);
		this.length += 4;
		return this;
	}

	u64(value: number): this {
		if (!Number.isSafeInteger(value) || value < 0)
			throw new RangeError('u64 requires a non-negative safe integer');
		return this.u32(Math.floor(value / 0x1_0000_0000)).u32(value >>> 0);
	}

	i64(value: number): this {
		if (!Number.isSafeInteger(value))
			throw new RangeError('i64 requires a safe integer');
		this.ensure(8);
		this.view.setBigInt64(this.length, BigInt(value));
		this.length += 8;
		return this;
	}

	i16(value: number): this {
		this.ensure(2);
		this.view.setInt16(this.length, value);
		this.length += 2;
		return this;
	}

	i32(value: number): this {
		this.ensure(4);
		this.view.setInt32(this.length, value);
		this.length += 4;
		return this;
	}

	fixed16_16(value: number): this {
		return this.i32(Math.round(value * 0x10000));
	}

	fixed2_30(value: number): this {
		return this.i32(Math.round(value * 0x4000_0000));
	}

	f32(value: number): this {
		this.ensure(4);
		this.view.setFloat32(this.length, value);
		this.length += 4;
		return this;
	}

	f64(value: number): this {
		this.ensure(8);
		this.view.setFloat64(this.length, value);
		this.length += 8;
		return this;
	}

	fourcc(value: string): this {
		if (value.length !== 4)
			throw new RangeError('fourcc must contain four characters');
		return this.bytes(textEncoder.encode(value));
	}

	bytes(value: ArrayBufferView | Uint8Array): this {
		const bytes = new Uint8Array(
			value.buffer,
			value.byteOffset,
			value.byteLength
		);
		this.ensure(bytes.length);
		this.storage.set(bytes, this.length);
		this.length += bytes.length;
		return this;
	}

	zeros(length: number): this {
		this.ensure(length);
		this.storage.fill(0, this.length, this.length + length);
		this.length += length;
		return this;
	}

	box(type: string, body: BoxBody): this {
		const child = new ByteWriter();
		body(child);
		const payload = child.finish();
		const size = payload.length + 8;
		if (size > 0xffff_ffff) {
			this.u32(1)
				.fourcc(type)
				.u64(payload.length + 16)
				.bytes(payload);
		} else {
			this.u32(size).fourcc(type).bytes(payload);
		}
		return this;
	}

	fullBox(type: string, version: number, flags: number, body: BoxBody): this {
		return this.box(type, (writer) => {
			writer.u8(version).u24(flags);
			body(writer);
		});
	}

	patchU32(offset: number, value: number): this {
		if (offset < 0 || offset + 4 > this.length)
			throw new RangeError('patch is outside written bytes');
		this.view.setUint32(offset, value);
		return this;
	}

	finish(): Uint8Array {
		return this.storage.slice(0, this.length);
	}

	private ensure(additional: number): void {
		const required = this.length + additional;
		if (required <= this.storage.length) return;
		let capacity = this.storage.length;
		while (capacity < required) capacity = Math.max(capacity * 2, required);
		const next = new Uint8Array(capacity);
		next.set(this.storage);
		this.storage = next;
		this.view = new DataView(next.buffer);
	}
}
