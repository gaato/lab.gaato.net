import { ByteWriter, encodeLzw, lzwMinCodeSize, writeSubBlocks } from './lzw';

export interface GifFrame {
	indices: Uint8Array;
	delayCentiseconds: number;
}

export interface GifOptions {
	width: number;
	height: number;
	palette: Uint8Array;
	paletteSize: number;
	transparentIndex: number | null;
	loop: number;
	frames: GifFrame[];
}

function validateOptions(options: GifOptions): void {
	if (
		!Number.isInteger(options.width) ||
		options.width < 1 ||
		options.width > 65535 ||
		!Number.isInteger(options.height) ||
		options.height < 1 ||
		options.height > 65535
	) {
		throw new RangeError(
			'width and height must be integers from 1 through 65535'
		);
	}
	if (
		!Number.isInteger(options.paletteSize) ||
		options.paletteSize < 2 ||
		options.paletteSize > 256 ||
		(options.paletteSize & (options.paletteSize - 1)) !== 0
	) {
		throw new RangeError(
			'paletteSize must be a power of two from 2 through 256'
		);
	}
	if (options.palette.length !== options.paletteSize * 3) {
		throw new RangeError('palette length must be three times paletteSize');
	}
	if (options.frames.length === 0) {
		throw new RangeError('at least one frame is required');
	}
	const pixelCount = options.width * options.height;
	if (options.frames.some((frame) => frame.indices.length !== pixelCount)) {
		throw new RangeError('every frame must contain width times height indices');
	}
}

export function encodeGif(options: GifOptions): Uint8Array {
	validateOptions(options);
	const output = new ByteWriter();
	const sizeBits = Math.log2(options.paletteSize) - 1;
	const minimumCodeSize = lzwMinCodeSize(options.paletteSize);
	output.writeBytes(new TextEncoder().encode('GIF89a'));
	output.writeUint16LE(options.width);
	output.writeUint16LE(options.height);
	output.writeByte(0x80 | (7 << 4) | sizeBits);
	output.writeByte(0);
	output.writeByte(0);
	output.writeBytes(options.palette);

	output.writeBytes(Uint8Array.of(0x21, 0xff, 0x0b));
	output.writeBytes(new TextEncoder().encode('NETSCAPE2.0'));
	output.writeBytes(Uint8Array.of(0x03, 0x01));
	output.writeUint16LE(options.loop);
	output.writeByte(0);

	for (const frame of options.frames) {
		const transparent = options.transparentIndex !== null;
		const delay = Math.min(
			65535,
			Math.max(0, Math.round(frame.delayCentiseconds))
		);
		output.writeBytes(Uint8Array.of(0x21, 0xf9, 0x04));
		output.writeByte((2 << 2) | (transparent ? 1 : 0));
		output.writeUint16LE(delay);
		output.writeByte(options.transparentIndex ?? 0);
		output.writeByte(0);

		output.writeByte(0x2c);
		output.writeUint16LE(0);
		output.writeUint16LE(0);
		output.writeUint16LE(options.width);
		output.writeUint16LE(options.height);
		output.writeByte(0);
		output.writeByte(minimumCodeSize);
		writeSubBlocks(output, encodeLzw(frame.indices, minimumCodeSize));
	}
	output.writeByte(0x3b);
	return output.toUint8Array();
}
