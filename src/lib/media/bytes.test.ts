import { describe, expect, it } from 'vitest';

import { ByteReader, ByteWriter } from './bytes';

describe('big-endian byte helpers', () => {
	it('round-trips scalar values and sub-readers', () => {
		const bytes = new ByteWriter()
			.u8(0xab)
			.u16(0xcdef)
			.u24(0x123456)
			.u32(0x89abcdef)
			.u64(0x20_1234_5678)
			.i16(-1234)
			.i32(-12345678)
			.fixed16_16(1.5)
			.fixed2_30(-0.5)
			.fourcc('test')
			.finish();
		const reader = new ByteReader(bytes);
		expect(reader.u8()).toBe(0xab);
		expect(reader.u16()).toBe(0xcdef);
		expect(reader.u24()).toBe(0x123456);
		expect(reader.u32()).toBe(0x89abcdef);
		expect(reader.u64()).toBe(0x20_1234_5678);
		expect(reader.i16()).toBe(-1234);
		expect(reader.i32()).toBe(-12345678);
		expect(reader.fixed16_16()).toBe(1.5);
		expect(reader.fixed2_30()).toBe(-0.5);
		expect(reader.subReader(4).fourcc()).toBe('test');
		expect(reader.remaining).toBe(0);
	});

	it('writes nested and full boxes with their sizes', () => {
		const bytes = new ByteWriter()
			.box('moov', (moov) =>
				moov.fullBox('test', 1, 0x123456, (body) => body.u32(42))
			)
			.finish();
		const reader = new ByteReader(bytes);
		expect(reader.u32()).toBe(bytes.length);
		expect(reader.fourcc()).toBe('moov');
		expect(reader.u32()).toBe(16);
		expect(reader.fourcc()).toBe('test');
		expect(reader.u8()).toBe(1);
		expect(reader.u24()).toBe(0x123456);
		expect(reader.u32()).toBe(42);
	});

	it('rejects out-of-bounds reads and unsafe u64 values', () => {
		expect(() => new ByteReader(Uint8Array.of(1)).u16()).toThrow(RangeError);
		expect(() => new ByteWriter().u64(Number.MAX_SAFE_INTEGER + 1)).toThrow(
			RangeError
		);
	});
});
