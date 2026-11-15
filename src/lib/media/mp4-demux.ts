import { ByteReader } from './bytes';

export type MediaErrorCode =
	| 'container_unsupported'
	| 'fragmented_unsupported'
	| 'codec_unsupported'
	| 'invalid_media';

export class MediaError extends Error {
	constructor(
		readonly code: MediaErrorCode,
		message: string,
		readonly detail?: string
	) {
		super(message);
		this.name = 'MediaError';
	}
}

export interface RandomAccessSource {
	readonly size: number;
	read(offset: number, length: number): Promise<Uint8Array>;
}

export function blobSource(blob: Blob): RandomAccessSource {
	return {
		size: blob.size,
		async read(offset, length) {
			if (offset < 0 || length < 0 || offset + length > blob.size)
				throw new RangeError('blob read is outside the source');
			return new Uint8Array(
				await blob.slice(offset, offset + length).arrayBuffer()
			);
		}
	};
}

export interface DemuxedSample {
	offset: number;
	size: number;
	dts: number;
	pts: number;
	duration: number;
	dtsUs: number;
	ptsUs: number;
	durationUs: number;
	keyframe: boolean;
}

interface TrackBase {
	id: number;
	kind: 'video' | 'audio';
	timescale: number;
	duration: number;
	codec: string;
	description?: Uint8Array;
	samples: DemuxedSample[];
}

export interface DemuxedVideoTrack extends TrackBase {
	kind: 'video';
	sampleEntry: 'avc1' | 'avc3' | 'hvc1' | 'hev1' | 'av01' | 'vp09';
	width: number;
	height: number;
	rotation: 0 | 90 | 180 | 270;
}

export interface DemuxedAudioTrack extends TrackBase {
	kind: 'audio';
	sampleEntry: 'mp4a' | 'Opus';
	channelCount: number;
	sampleRate: number;
}

export type DemuxedTrack = DemuxedVideoTrack | DemuxedAudioTrack;

export interface DemuxResult {
	durationUs: number;
	tracks: DemuxedTrack[];
	readSample(track: DemuxedTrack, index: number): Promise<Uint8Array>;
}

interface Box {
	type: string;
	start: number;
	headerSize: number;
	size: number;
	payload: Uint8Array;
}

interface ParsedTrack {
	id?: number;
	kind?: 'video' | 'audio';
	timescale?: number;
	duration?: number;
	rotation: 0 | 90 | 180 | 270;
	mediaTime: number;
	delayUs: number;
	entry?: Omit<
		DemuxedVideoTrack,
		keyof TrackBase | 'samples' | 'id' | 'timescale' | 'duration' | 'rotation'
	> &
		Partial<Pick<DemuxedVideoTrack, 'codec' | 'description'>>;
	audioEntry?: Omit<
		DemuxedAudioTrack,
		keyof TrackBase | 'samples' | 'id' | 'timescale' | 'duration'
	> &
		Partial<Pick<DemuxedAudioTrack, 'codec' | 'description'>>;
	stts: Array<[number, number]>;
	ctts: Array<[number, number]>;
	stss?: Set<number>;
	sizes: number[];
	stsc: Array<[number, number, number]>;
	chunkOffsets: number[];
}

function fail(message: string): never {
	throw new MediaError('invalid_media', message);
}

function boxes(bytes: Uint8Array, start = 0, end = bytes.length): Box[] {
	const result: Box[] = [];
	let offset = start;
	while (offset + 8 <= end) {
		const header = new ByteReader(
			bytes.subarray(offset, Math.min(end, offset + 16))
		);
		let size = header.u32();
		const type = header.fourcc();
		let headerSize = 8;
		if (size === 1) {
			if (offset + 16 > end) fail(`truncated ${type} box header`);
			size = header.u64();
			headerSize = 16;
		} else if (size === 0) {
			size = end - offset;
		}
		if (size < headerSize || offset + size > end)
			fail(`invalid ${type} box size`);
		result.push({
			type,
			start: offset,
			headerSize,
			size,
			payload: bytes.subarray(offset + headerSize, offset + size)
		});
		offset += size;
	}
	if (
		offset !== end &&
		bytes.subarray(offset, end).some((value) => value !== 0)
	)
		fail('trailing bytes after MP4 boxes');
	return result;
}

function child(parent: Box, type: string): Box | undefined {
	return boxes(parent.payload).find((box) => box.type === type);
}

function children(parent: Box, type: string): Box[] {
	return boxes(parent.payload).filter((box) => box.type === type);
}

function fullBox(box: Box): {
	version: number;
	flags: number;
	reader: ByteReader;
} {
	const reader = new ByteReader(box.payload);
	return { version: reader.u8(), flags: reader.u24(), reader };
}

function rotationFromMatrix(values: number[]): 0 | 90 | 180 | 270 {
	const [a, b, , c, d] = values;
	const near = (left: number, right: number) => Math.abs(left - right) < 0.01;
	if (near(a, 0) && near(b, -1) && near(c, 1) && near(d, 0)) return 90;
	if (near(a, -1) && near(b, 0) && near(c, 0) && near(d, -1)) return 180;
	if (near(a, 0) && near(b, 1) && near(c, -1) && near(d, 0)) return 270;
	return 0;
}

function parseTkhd(box: Box, track: ParsedTrack): void {
	const { version, reader } = fullBox(box);
	reader.skip(version === 1 ? 16 : 8);
	track.id = reader.u32();
	reader.skip(4);
	if (version === 1) reader.u64();
	else reader.u32();
	reader.skip(8 + 2 + 2 + 2 + 2);
	track.rotation = rotationFromMatrix([
		reader.fixed16_16(),
		reader.fixed16_16(),
		reader.fixed2_30(),
		reader.fixed16_16(),
		reader.fixed16_16(),
		reader.fixed2_30(),
		reader.fixed16_16(),
		reader.fixed16_16(),
		reader.fixed2_30()
	]);
}

function parseMdhd(box: Box, track: ParsedTrack): void {
	const { version, reader } = fullBox(box);
	reader.skip(version === 1 ? 16 : 8);
	track.timescale = reader.u32();
	track.duration = version === 1 ? reader.u64() : reader.u32();
}

function parseMvhdTimescale(box: Box): number {
	const { version, reader } = fullBox(box);
	reader.skip(version === 1 ? 16 : 8);
	return reader.u32();
}

function parseElst(box: Box, track: ParsedTrack, movieTimescale: number): void {
	const { version, reader } = fullBox(box);
	const count = reader.u32();
	let sawMedia = false;
	for (let index = 0; index < count; index += 1) {
		const segmentDuration = version === 1 ? reader.u64() : reader.u32();
		const mediaTime = version === 1 ? reader.i64() : reader.i32();
		reader.i16();
		reader.i16();
		if (!sawMedia && mediaTime === -1) {
			track.delayUs += Math.round(
				(segmentDuration * 1_000_000) / movieTimescale
			);
		} else if (!sawMedia) {
			track.mediaTime = mediaTime;
			sawMedia = true;
		}
	}
}

function hex(value: number, width = 2): string {
	return value.toString(16).padStart(width, '0').toUpperCase();
}

function avcCodec(type: string, config: Uint8Array): string {
	if (config.length < 4) fail('truncated avcC box');
	return `${type}.${hex(config[1])}${hex(config[2])}${hex(config[3])}`;
}

function reverseBits32(value: number): number {
	let result = 0;
	for (let bit = 0; bit < 32; bit += 1)
		result = (result * 2 + ((value >>> bit) & 1)) >>> 0;
	return result;
}

function hevcCodec(type: string, config: Uint8Array): string {
	if (config.length < 13) fail('truncated hvcC box');
	const profileSpace = ['', 'A', 'B', 'C'][config[1] >>> 6];
	const profile = config[1] & 0x1f;
	const compatibility = reverseBits32(
		new DataView(config.buffer, config.byteOffset + 2, 4).getUint32(0)
	);
	const tier = config[1] & 0x20 ? 'H' : 'L';
	const constraints = Array.from(config.subarray(6, 12));
	while (constraints.at(-1) === 0) constraints.pop();
	return `${type}.${profileSpace}${profile}.${compatibility.toString(16)}.${tier}${config[12]}${constraints.length ? `.${constraints.map((value) => hex(value)).join('')}` : ''}`;
}

function av1Codec(config: Uint8Array): string {
	if (config.length < 4) fail('truncated av1C box');
	const profile = config[1] >>> 5;
	const level = config[1] & 0x1f;
	const tier = config[2] & 0x80 ? 'H' : 'M';
	const depth = config[2] & 0x40 ? (config[2] & 0x20 ? 12 : 10) : 8;
	return `av01.${profile}.${hex(level)}${tier}.${depth.toString().padStart(2, '0')}`;
}

function vp9Codec(config: Uint8Array): string {
	if (config.length < 4) return 'vp09.00.10.08';
	return `vp09.${hex(config[0])}.${hex(config[1])}.${hex(config[2])}`;
}

function findNestedBox(
	payload: Uint8Array,
	offset: number,
	type: string
): Box | undefined {
	const entries = boxes(payload, offset);
	const direct = entries.find((box) => box.type === type);
	if (direct) return direct;
	for (const entry of entries) {
		if (entry.type === 'wave') {
			const nested = boxes(entry.payload).find((box) => box.type === type);
			if (nested) return nested;
		}
	}
	return undefined;
}

function parseVideoEntry(type: string, payload: Uint8Array) {
	if (!['avc1', 'avc3', 'hvc1', 'hev1', 'av01', 'vp09'].includes(type))
		throw new MediaError(
			'codec_unsupported',
			`unsupported video codec ${type}`,
			type
		);
	if (payload.length < 78) fail(`truncated ${type} sample entry`);
	const view = new DataView(
		payload.buffer,
		payload.byteOffset,
		payload.byteLength
	);
	const width = view.getUint16(24);
	const height = view.getUint16(26);
	const configType =
		type === 'avc1' || type === 'avc3'
			? 'avcC'
			: type === 'hvc1' || type === 'hev1'
				? 'hvcC'
				: type === 'av01'
					? 'av1C'
					: 'vpcC';
	const config = findNestedBox(payload, 78, configType)?.payload;
	if (!config) fail(`${type} sample entry has no ${configType}`);
	const codec =
		configType === 'avcC'
			? avcCodec(type, config)
			: configType === 'hvcC'
				? hevcCodec(type, config)
				: configType === 'av1C'
					? av1Codec(config)
					: vp9Codec(config);
	return {
		sampleEntry: type as DemuxedVideoTrack['sampleEntry'],
		width,
		height,
		codec,
		...(configType === 'avcC' || configType === 'hvcC'
			? { description: config.slice() }
			: {})
	};
}

function descriptorLength(reader: ByteReader): number {
	let length = 0;
	for (let index = 0; index < 4; index += 1) {
		const value = reader.u8();
		length = (length << 7) | (value & 0x7f);
		if (!(value & 0x80)) return length;
	}
	fail('invalid ES descriptor length');
}

function parseEsds(payload: Uint8Array): {
	objectType: number;
	asc: Uint8Array;
} {
	// Descriptor headers are variable length; scanning is safe here because both
	// desired tags have strong length and object-type checks.
	let objectType = -1;
	let asc: Uint8Array | undefined;
	for (let offset = 4; offset + 2 <= payload.length; offset += 1) {
		const tag = payload[offset];
		if (tag !== 0x04 && tag !== 0x05) continue;
		try {
			const reader = new ByteReader(payload).seek(offset + 1);
			const length = descriptorLength(reader);
			if (length > reader.remaining) continue;
			if (tag === 0x04 && length >= 13) objectType = reader.u8();
			if (tag === 0x05 && length >= 2 && length <= 64)
				asc = reader.read(length).slice();
		} catch {
			// Continue looking for a valid descriptor boundary.
		}
	}
	if (objectType < 0 || !asc) fail('invalid AAC ES descriptor');
	return { objectType, asc };
}

const aacSampleRates = [
	96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025,
	8000, 7350
];

function parseAsc(asc: Uint8Array): {
	aot: number;
	sampleRate?: number;
	channels?: number;
} {
	if (asc.length < 2) return { aot: 2 };
	let aot = asc[0] >>> 3;
	if (aot === 31) aot = 32 + ((asc[0] & 7) << 3) + (asc[1] >>> 5);
	const frequencyIndex = ((asc[0] & 7) << 1) | (asc[1] >>> 7);
	const channelIndex = (asc[1] >>> 3) & 0x0f;
	return {
		aot,
		sampleRate: aacSampleRates[frequencyIndex],
		channels: channelIndex || undefined
	};
}

function opusHeadFromDops(dops: Uint8Array): Uint8Array {
	if (dops.length < 11) fail('truncated dOps box');
	const input = new DataView(dops.buffer, dops.byteOffset, dops.byteLength);
	const mappingFamily = dops[10];
	const extra = mappingFamily === 0 ? 0 : 2 + dops[1];
	if (dops.length < 11 + extra) fail('truncated dOps channel mapping');
	const head = new Uint8Array(19 + extra);
	head.set(new TextEncoder().encode('OpusHead'));
	// dOps version 0 represents the current OpusHead version 1 mapping.
	head[8] = 1;
	head[9] = dops[1];
	const output = new DataView(head.buffer);
	output.setUint16(10, input.getUint16(2), true);
	output.setUint32(12, input.getUint32(4), true);
	output.setInt16(16, input.getInt16(8), true);
	head[18] = mappingFamily;
	if (extra) head.set(dops.subarray(11, 11 + extra), 19);
	return head;
}

function parseAudioEntry(type: string, payload: Uint8Array) {
	if (type !== 'mp4a' && type !== 'Opus')
		throw new MediaError(
			'codec_unsupported',
			`unsupported audio codec ${type}`,
			type
		);
	if (payload.length < 28) fail(`truncated ${type} sample entry`);
	const view = new DataView(
		payload.buffer,
		payload.byteOffset,
		payload.byteLength
	);
	const version = view.getUint16(8);
	let channelCount = view.getUint16(16);
	let sampleRate = view.getUint32(24) / 0x10000;
	let childOffset = 28;
	if (version === 1) childOffset += 16;
	else if (version === 2) {
		if (payload.length < 64) fail('truncated QuickTime sound sample entry v2');
		sampleRate = view.getFloat64(32);
		channelCount = view.getUint32(40);
		childOffset = 64;
	} else if (version !== 0) {
		fail(`unsupported QuickTime sound sample entry version ${version}`);
	}
	if (type === 'mp4a') {
		const esds = findNestedBox(payload, childOffset, 'esds');
		if (!esds) fail('mp4a sample entry has no esds');
		const { objectType, asc } = parseEsds(esds.payload);
		const parsed = parseAsc(asc);
		if (objectType !== 0x40)
			throw new MediaError(
				'codec_unsupported',
				`unsupported MPEG-4 object type ${hex(objectType)}`,
				type
			);
		return {
			sampleEntry: 'mp4a' as const,
			codec: `mp4a.40.${parsed.aot}`,
			description: asc,
			channelCount: parsed.channels ?? channelCount,
			sampleRate: parsed.sampleRate ?? sampleRate
		};
	}
	const dops = findNestedBox(payload, childOffset, 'dOps');
	if (!dops) fail('Opus sample entry has no dOps');
	return {
		sampleEntry: 'Opus' as const,
		codec: 'opus',
		description: opusHeadFromDops(dops.payload),
		channelCount,
		sampleRate: 48000
	};
}

function parseStsd(box: Box, track: ParsedTrack): void {
	const { reader } = fullBox(box);
	if (reader.u32() < 1) fail('sample description table is empty');
	const size = reader.u32();
	const type = reader.fourcc();
	if (size < 8 || size - 8 > reader.remaining)
		fail('invalid sample entry size');
	const payload = reader.read(size - 8);
	if (track.kind === 'video') track.entry = parseVideoEntry(type, payload);
	else if (track.kind === 'audio')
		track.audioEntry = parseAudioEntry(type, payload);
}

function parseRuns(box: Box, signed: boolean): Array<[number, number]> {
	const { version, reader } = fullBox(box);
	const result: Array<[number, number]> = [];
	for (let count = reader.u32(); count > 0; count -= 1)
		result.push([
			reader.u32(),
			signed && version === 1 ? reader.i32() : reader.u32()
		]);
	return result;
}

function parseSizes(stbl: Box): number[] {
	const stsz = child(stbl, 'stsz');
	if (stsz) {
		const { reader } = fullBox(stsz);
		const constant = reader.u32();
		const count = reader.u32();
		return constant
			? Array(count).fill(constant)
			: Array.from({ length: count }, () => reader.u32());
	}
	const stz2 = child(stbl, 'stz2');
	if (!stz2) fail('sample table has neither stsz nor stz2');
	const { reader } = fullBox(stz2);
	reader.u24();
	const fieldSize = reader.u8();
	const count = reader.u32();
	if (fieldSize === 16)
		return Array.from({ length: count }, () => reader.u16());
	if (fieldSize === 8) return Array.from({ length: count }, () => reader.u8());
	if (fieldSize === 4) {
		const result: number[] = [];
		while (result.length < count) {
			const value = reader.u8();
			result.push(value >>> 4);
			if (result.length < count) result.push(value & 0x0f);
		}
		return result;
	}
	fail(`unsupported stz2 field size ${fieldSize}`);
}

function parseSampleTable(stbl: Box, track: ParsedTrack): void {
	const stsd = child(stbl, 'stsd');
	const stts = child(stbl, 'stts');
	const stsc = child(stbl, 'stsc');
	const chunkBox = child(stbl, 'stco') ?? child(stbl, 'co64');
	if (!stsd || !stts || !stsc || !chunkBox) fail('incomplete sample table');
	parseStsd(stsd, track);
	track.stts = parseRuns(stts, false);
	const ctts = child(stbl, 'ctts');
	track.ctts = ctts ? parseRuns(ctts, true) : [];
	const stss = child(stbl, 'stss');
	if (stss) {
		const { reader } = fullBox(stss);
		track.stss = new Set(
			Array.from({ length: reader.u32() }, () => reader.u32())
		);
	}
	track.sizes = parseSizes(stbl);
	{
		const { reader } = fullBox(stsc);
		track.stsc = Array.from({ length: reader.u32() }, () => [
			reader.u32(),
			reader.u32(),
			reader.u32()
		]);
	}
	{
		const { reader } = fullBox(chunkBox);
		track.chunkOffsets = Array.from({ length: reader.u32() }, () =>
			chunkBox.type === 'co64' ? reader.u64() : reader.u32()
		);
	}
}

function expandRuns(
	runs: Array<[number, number]>,
	count: number,
	fallback: number
): number[] {
	const result: number[] = [];
	for (const [runCount, value] of runs) {
		for (let index = 0; index < runCount && result.length < count; index += 1)
			result.push(value);
	}
	while (result.length < count) result.push(fallback);
	return result;
}

function sampleOffsets(track: ParsedTrack): number[] {
	const result: number[] = [];
	let sampleIndex = 0;
	for (
		let chunkIndex = 1;
		chunkIndex <= track.chunkOffsets.length;
		chunkIndex += 1
	) {
		let rowIndex = track.stsc.findIndex((row) => row[0] > chunkIndex) - 1;
		if (rowIndex < 0) rowIndex = track.stsc.length - 1;
		const row = track.stsc[rowIndex];
		if (!row) fail('invalid sample-to-chunk table');
		let offset = track.chunkOffsets[chunkIndex - 1];
		for (
			let inChunk = 0;
			inChunk < row[1] && sampleIndex < track.sizes.length;
			inChunk += 1
		) {
			result.push(offset);
			offset += track.sizes[sampleIndex++];
		}
	}
	if (result.length !== track.sizes.length)
		fail('sample-to-chunk table does not cover every sample');
	return result;
}

function finishTrack(track: ParsedTrack): DemuxedTrack | null {
	if (!track.kind) return null;
	if (
		track.id === undefined ||
		!track.timescale ||
		track.duration === undefined
	)
		fail('track metadata is incomplete');
	const timescale = track.timescale;
	if (track.kind === 'video' && !track.entry)
		fail('video sample entry is missing');
	if (track.kind === 'audio' && !track.audioEntry)
		fail('audio sample entry is missing');
	const durations = expandRuns(track.stts, track.sizes.length, 0);
	const compositions = expandRuns(track.ctts, track.sizes.length, 0);
	const offsets = sampleOffsets(track);
	const toUs = (time: number): number =>
		Math.round(((time - track.mediaTime) * 1_000_000) / timescale) +
		track.delayUs;
	let dts = 0;
	const samples = track.sizes.map((size, index): DemuxedSample => {
		const duration = durations[index];
		const pts = dts + compositions[index];
		const sample = {
			offset: offsets[index],
			size,
			dts,
			pts,
			duration,
			dtsUs: toUs(dts),
			ptsUs: toUs(pts),
			durationUs: Math.round((duration * 1_000_000) / timescale),
			keyframe: !track.stss || track.stss.has(index + 1)
		};
		dts += duration;
		return sample;
	});
	const base = {
		id: track.id,
		kind: track.kind,
		timescale: track.timescale,
		duration: track.duration,
		samples
	};
	return track.kind === 'video'
		? ({
				...base,
				...track.entry!,
				rotation: track.rotation
			} as DemuxedVideoTrack)
		: ({ ...base, ...track.audioEntry! } as DemuxedAudioTrack);
}

function parseTrack(trak: Box, movieTimescale: number): DemuxedTrack | null {
	const track: ParsedTrack = {
		rotation: 0,
		mediaTime: 0,
		delayUs: 0,
		stts: [],
		ctts: [],
		sizes: [],
		stsc: [],
		chunkOffsets: []
	};
	const tkhd = child(trak, 'tkhd');
	const mdia = child(trak, 'mdia');
	if (!tkhd || !mdia) fail('track has no tkhd or mdia');
	parseTkhd(tkhd, track);
	const mdhd = child(mdia, 'mdhd');
	const hdlr = child(mdia, 'hdlr');
	if (!mdhd || !hdlr) fail('track media metadata is incomplete');
	parseMdhd(mdhd, track);
	const handler = fullBox(hdlr).reader;
	handler.skip(4);
	const handlerType = handler.fourcc();
	if (handlerType === 'vide') track.kind = 'video';
	else if (handlerType === 'soun') track.kind = 'audio';
	else return null;
	const edts = child(trak, 'edts');
	const elst = edts && child(edts, 'elst');
	if (elst) parseElst(elst, track, movieTimescale);
	const minf = child(mdia, 'minf');
	const stbl = minf && child(minf, 'stbl');
	if (!stbl) fail('track has no sample table');
	parseSampleTable(stbl, track);
	return finishTrack(track);
}

async function readTopLevel(
	source: RandomAccessSource
): Promise<Array<Omit<Box, 'payload'>>> {
	const result: Array<Omit<Box, 'payload'>> = [];
	let offset = 0;
	while (offset + 8 <= source.size) {
		const first = await source.read(offset, Math.min(16, source.size - offset));
		const reader = new ByteReader(first);
		let size = reader.u32();
		const type = reader.fourcc();
		let headerSize = 8;
		if (size === 1) {
			if (first.length < 16) fail(`truncated ${type} box header`);
			size = reader.u64();
			headerSize = 16;
		} else if (size === 0) size = source.size - offset;
		if (size < headerSize || offset + size > source.size)
			fail(`invalid top-level ${type} box`);
		result.push({ type, start: offset, headerSize, size });
		offset += size;
	}
	return result;
}

export async function demuxMp4(
	source: RandomAccessSource
): Promise<DemuxResult> {
	if (source.size < 8)
		throw new MediaError('container_unsupported', 'not an ISO BMFF file');
	const magic = await source.read(0, Math.min(12, source.size));
	if (
		magic[0] === 0x1a &&
		magic[1] === 0x45 &&
		magic[2] === 0xdf &&
		magic[3] === 0xa3
	)
		throw new MediaError(
			'container_unsupported',
			'WebM and Matroska are not supported'
		);
	const top = await readTopLevel(source);
	if (top.some((box) => box.type === 'moof'))
		throw new MediaError(
			'fragmented_unsupported',
			'fragmented MP4 is not supported'
		);
	const moovHeader = top.find((box) => box.type === 'moov');
	if (!moovHeader)
		throw new MediaError(
			'container_unsupported',
			'ISO BMFF file has no moov box'
		);
	const moovBytes = await source.read(moovHeader.start, moovHeader.size);
	const moov = boxes(moovBytes)[0];
	if (child(moov, 'mvex'))
		throw new MediaError(
			'fragmented_unsupported',
			'fragmented MP4 is not supported'
		);
	const mvhd = child(moov, 'mvhd');
	if (!mvhd) fail('movie header is missing');
	const movieTimescale = parseMvhdTimescale(mvhd);
	const tracks = children(moov, 'trak')
		.map((trak) => parseTrack(trak, movieTimescale))
		.filter((track): track is DemuxedTrack => track !== null);
	if (!tracks.length) fail('movie contains no supported audio or video tracks');
	const durationUs = tracks.reduce((end, track) => {
		const bounds = track.samples.reduce(
			(range, sample) => ({
				start: Math.min(range.start, sample.ptsUs),
				end: Math.max(range.end, sample.ptsUs + sample.durationUs),
				duration: range.duration + sample.duration
			}),
			{ start: Infinity, end: 0, duration: 0 }
		);
		// With reordered VFR, the last presentation sample's decode duration
		// need not describe its presentation length. Retain the full stts span.
		const spanEnd = track.samples.length
			? bounds.start +
				Math.round((bounds.duration * 1_000_000) / track.timescale)
			: 0;
		return Math.max(end, bounds.end, spanEnd);
	}, 0);
	return {
		durationUs,
		tracks,
		async readSample(track, index) {
			const sample = track.samples[index];
			if (!sample) throw new RangeError('sample index is outside the track');
			return source.read(sample.offset, sample.size);
		}
	};
}
