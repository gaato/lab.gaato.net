import { ByteWriter } from './bytes';

export interface EncodedSample {
	data: Uint8Array;
	timestampUs: number;
	/** Supply decode timestamps only for reordered samples, in decode order. */
	decodeTimestampUs?: number;
	durationUs: number;
	keyframe: boolean;
}

export interface MuxVideoTrack {
	sampleEntry: 'avc1';
	description: Uint8Array;
	width: number;
	height: number;
	rotation?: 0 | 90 | 180 | 270;
	samples: EncodedSample[];
}

export interface MuxAudioTrack {
	sampleEntry: 'mp4a' | 'Opus';
	description?: Uint8Array;
	channelCount: number;
	sampleRate: number;
	samples: EncodedSample[];
}

export interface MuxInput {
	video?: MuxVideoTrack;
	audio?: MuxAudioTrack;
}

interface PreparedSample extends EncodedSample {
	duration: number;
	dts: number;
	pts: number;
}

interface Chunk {
	track: PreparedTrack;
	samples: PreparedSample[];
	startUs: number;
	offset: number;
}

interface PreparedTrack {
	id: number;
	kind: 'video' | 'audio';
	timescale: number;
	duration: number;
	samples: PreparedSample[];
	chunks: Chunk[];
	video?: MuxVideoTrack;
	audio?: MuxAudioTrack;
}

function ticks(us: number, timescale: number): number {
	return Math.max(0, Math.round((us * timescale) / 1_000_000));
}

function rle(values: number[]): Array<[number, number]> {
	const runs: Array<[number, number]> = [];
	for (const value of values) {
		const last = runs.at(-1);
		if (last?.[1] === value) last[0] += 1;
		else runs.push([1, value]);
	}
	return runs;
}

function descriptor(tag: number, payload: Uint8Array): Uint8Array {
	const length: number[] = [payload.length & 0x7f];
	for (let value = payload.length >>> 7; value > 0; value >>>= 7)
		length.unshift((value & 0x7f) | 0x80);
	return Uint8Array.of(tag, ...length, ...payload);
}

function esds(asc: Uint8Array): Uint8Array {
	const specific = descriptor(0x05, asc);
	const decoder = new ByteWriter()
		.u8(0x40)
		.u8(0x15)
		.u24(0)
		.u32(0)
		.u32(0)
		.bytes(specific)
		.finish();
	const config = descriptor(0x04, decoder);
	const sl = descriptor(0x06, Uint8Array.of(2));
	return descriptor(
		0x03,
		new ByteWriter().u16(1).u8(0).bytes(config).bytes(sl).finish()
	);
}

function dopsFromOpusHead(
	description: Uint8Array | undefined,
	channels: number
): Uint8Array {
	const valid =
		description &&
		description.length >= 19 &&
		new TextDecoder().decode(description.subarray(0, 8)) === 'OpusHead';
	const head = valid ? description : undefined;
	const mapping = head?.[18] ?? 0;
	const extra = mapping === 0 ? new Uint8Array() : head!.subarray(19);
	const writer = new ByteWriter()
		// OpusSpecificBox version is currently 0; it is not the OpusHead version.
		.u8(0)
		.u8(head?.[9] ?? channels)
		.u16(
			head
				? new DataView(head.buffer, head.byteOffset + 10, 2).getUint16(0, true)
				: 312
		)
		.u32(
			head
				? new DataView(head.buffer, head.byteOffset + 12, 4).getUint32(0, true)
				: 48000
		)
		.i16(
			head
				? new DataView(head.buffer, head.byteOffset + 16, 2).getInt16(0, true)
				: 0
		)
		.u8(mapping)
		.bytes(extra);
	return writer.finish();
}

function writeMatrix(writer: ByteWriter, rotation: number): void {
	const matrix =
		rotation === 90
			? [0, -1, 0, 1, 0, 0, 0, 0, 1]
			: rotation === 180
				? [-1, 0, 0, 0, -1, 0, 0, 0, 1]
				: rotation === 270
					? [0, 1, 0, -1, 0, 0, 0, 0, 1]
					: [1, 0, 0, 0, 1, 0, 0, 0, 1];
	for (let index = 0; index < matrix.length; index += 1) {
		if (index === 2 || index === 5 || index === 8)
			writer.fixed2_30(matrix[index]);
		else writer.fixed16_16(matrix[index]);
	}
}

function languageUnd(): number {
	return ((21 & 31) << 10) | ((14 & 31) << 5) | (4 & 31);
}

function writeMvhd(
	writer: ByteWriter,
	durationMs: number,
	nextTrackId: number
): void {
	writer.fullBox('mvhd', 0, 0, (box) => {
		box.u32(0).u32(0).u32(1000).u32(durationMs);
		box.fixed16_16(1).i16(0x0100).u16(0).zeros(8);
		writeMatrix(box, 0);
		box.zeros(24).u32(nextTrackId);
	});
}

function writeTkhd(writer: ByteWriter, track: PreparedTrack): void {
	const durationMs = Math.round((track.duration * 1000) / track.timescale);
	writer.fullBox('tkhd', 0, 7, (box) => {
		box.u32(0).u32(0).u32(track.id).u32(0).u32(durationMs).zeros(8);
		box
			.i16(0)
			.i16(0)
			.i16(track.kind === 'audio' ? 0x0100 : 0)
			.u16(0);
		writeMatrix(box, track.video?.rotation ?? 0);
		box
			.fixed16_16(track.video?.width ?? 0)
			.fixed16_16(track.video?.height ?? 0);
	});
}

function writeMdhd(writer: ByteWriter, track: PreparedTrack): void {
	writer.fullBox('mdhd', 0, 0, (box) =>
		box
			.u32(0)
			.u32(0)
			.u32(track.timescale)
			.u32(track.duration)
			.u16(languageUnd())
			.u16(0)
	);
}

function writeHdlr(writer: ByteWriter, kind: PreparedTrack['kind']): void {
	writer.fullBox('hdlr', 0, 0, (box) => {
		box
			.u32(0)
			.fourcc(kind === 'video' ? 'vide' : 'soun')
			.zeros(12);
		box.bytes(
			new TextEncoder().encode(
				kind === 'video' ? 'VideoHandler\0' : 'SoundHandler\0'
			)
		);
	});
}

function writeVideoEntry(writer: ByteWriter, video: MuxVideoTrack): void {
	writer.box('avc1', (entry) => {
		entry.zeros(6).u16(1).zeros(16).u16(video.width).u16(video.height);
		entry.u32(0x00480000).u32(0x00480000).u32(0).u16(1);
		entry.zeros(32).u16(0x0018).u16(0xffff);
		entry.box('avcC', (config) => config.bytes(video.description));
	});
}

function writeAudioEntry(writer: ByteWriter, audio: MuxAudioTrack): void {
	writer.box(audio.sampleEntry, (entry) => {
		entry.zeros(6).u16(1).u16(0).u16(0).u32(0);
		entry.u16(audio.channelCount).u16(16).u16(0).u16(0);
		entry.u32(audio.sampleRate * 0x10000);
		if (audio.sampleEntry === 'mp4a') {
			if (!audio.description)
				throw new Error('AAC muxing requires AudioSpecificConfig');
			entry.fullBox('esds', 0, 0, (box) => box.bytes(esds(audio.description!)));
		} else {
			entry.box('dOps', (box) =>
				box.bytes(dopsFromOpusHead(audio.description, audio.channelCount))
			);
		}
	});
}

function writeStsd(writer: ByteWriter, track: PreparedTrack): void {
	writer.fullBox('stsd', 0, 0, (box) => {
		box.u32(1);
		if (track.video) writeVideoEntry(box, track.video);
		else writeAudioEntry(box, track.audio!);
	});
}

function writeStts(writer: ByteWriter, track: PreparedTrack): void {
	const runs = rle(track.samples.map((sample) => sample.duration));
	writer.fullBox('stts', 0, 0, (box) => {
		box.u32(runs.length);
		for (const [count, duration] of runs) box.u32(count).u32(duration);
	});
}

function writeCtts(writer: ByteWriter, track: PreparedTrack): void {
	const offsets = track.samples.map((sample) => sample.pts - sample.dts);
	if (!offsets.some(Boolean)) return;
	const runs = rle(offsets);
	const signed = offsets.some((value) => value < 0);
	writer.fullBox('ctts', signed ? 1 : 0, 0, (box) => {
		box.u32(runs.length);
		for (const [count, offset] of runs) {
			box.u32(count);
			if (signed) box.i32(offset);
			else box.u32(offset);
		}
	});
}

function writeStss(writer: ByteWriter, track: PreparedTrack): void {
	if (track.kind !== 'video') return;
	const sync = track.samples.flatMap((sample, index) =>
		sample.keyframe ? [index + 1] : []
	);
	writer.fullBox('stss', 0, 0, (box) => {
		box.u32(sync.length);
		for (const index of sync) box.u32(index);
	});
}

function writeStsz(writer: ByteWriter, track: PreparedTrack): void {
	writer.fullBox('stsz', 0, 0, (box) => {
		box.u32(0).u32(track.samples.length);
		for (const sample of track.samples) box.u32(sample.data.length);
	});
}

function writeStsc(writer: ByteWriter, track: PreparedTrack): void {
	const entries: Array<[number, number]> = [];
	track.chunks.forEach((chunk, index) => {
		if (entries.at(-1)?.[1] !== chunk.samples.length)
			entries.push([index + 1, chunk.samples.length]);
	});
	writer.fullBox('stsc', 0, 0, (box) => {
		box.u32(entries.length);
		for (const [firstChunk, samplesPerChunk] of entries)
			box.u32(firstChunk).u32(samplesPerChunk).u32(1);
	});
}

function writeOffsets(
	writer: ByteWriter,
	track: PreparedTrack,
	forceCo64: boolean
): void {
	writer.fullBox(forceCo64 ? 'co64' : 'stco', 0, 0, (box) => {
		box.u32(track.chunks.length);
		for (const chunk of track.chunks) {
			if (forceCo64) box.u64(chunk.offset);
			else box.u32(chunk.offset);
		}
	});
}

function writeStbl(
	writer: ByteWriter,
	track: PreparedTrack,
	forceCo64: boolean
): void {
	writer.box('stbl', (stbl) => {
		writeStsd(stbl, track);
		writeStts(stbl, track);
		writeCtts(stbl, track);
		writeStss(stbl, track);
		writeStsz(stbl, track);
		writeStsc(stbl, track);
		writeOffsets(stbl, track, forceCo64);
	});
}

function writeMinf(
	writer: ByteWriter,
	track: PreparedTrack,
	forceCo64: boolean
): void {
	writer.box('minf', (minf) => {
		if (track.kind === 'video')
			minf.fullBox('vmhd', 0, 1, (box) => box.u16(0).u16(0).u16(0).u16(0));
		else minf.fullBox('smhd', 0, 0, (box) => box.i16(0).u16(0));
		minf.box('dinf', (dinf) =>
			dinf.fullBox('dref', 0, 0, (dref) => {
				dref.u32(1).fullBox('url ', 0, 1, () => undefined);
			})
		);
		writeStbl(minf, track, forceCo64);
	});
}

function writeTrak(
	writer: ByteWriter,
	track: PreparedTrack,
	forceCo64: boolean
): void {
	writer.box('trak', (trak) => {
		writeTkhd(trak, track);
		trak.box('mdia', (mdia) => {
			writeMdhd(mdia, track);
			writeHdlr(mdia, track.kind);
			writeMinf(mdia, track, forceCo64);
		});
	});
}

function makeMoov(tracks: PreparedTrack[], forceCo64: boolean): Uint8Array {
	const durationMs = Math.max(
		0,
		...tracks.map((track) =>
			Math.round((track.duration * 1000) / track.timescale)
		)
	);
	return new ByteWriter()
		.box('moov', (moov) => {
			writeMvhd(moov, durationMs, tracks.length + 1);
			for (const track of tracks) writeTrak(moov, track, forceCo64);
		})
		.finish();
}

function prepareTrack(
	id: number,
	kind: PreparedTrack['kind'],
	input: MuxVideoTrack | MuxAudioTrack
): PreparedTrack {
	const timescale =
		kind === 'video' ? 90_000 : (input as MuxAudioTrack).sampleRate;
	const firstTimestamp =
		input.samples[0]?.decodeTimestampUs ?? input.samples[0]?.timestampUs ?? 0;
	const samples = input.samples.map((sample, index) => {
		const dts = ticks(
			(sample.decodeTimestampUs ?? sample.timestampUs) - firstTimestamp,
			timescale
		);
		const next = input.samples[index + 1];
		const nextDts = next
			? ticks(
					(next.decodeTimestampUs ?? next.timestampUs) - firstTimestamp,
					timescale
				)
			: dts;
		// Subtract rounded endpoints to avoid accumulating per-sample rounding error.
		const duration =
			nextDts > dts
				? nextDts - dts
				: Math.max(1, ticks(sample.durationUs, timescale));
		return {
			...sample,
			duration,
			dts,
			pts: ticks(sample.timestampUs - firstTimestamp, timescale)
		};
	});
	const track: PreparedTrack = {
		id,
		kind,
		timescale,
		duration: samples.reduce(
			(end, sample) =>
				Math.max(
					end,
					sample.dts + sample.duration,
					sample.pts + sample.duration
				),
			0
		),
		samples,
		chunks: [],
		...(kind === 'video'
			? { video: input as MuxVideoTrack }
			: { audio: input as MuxAudioTrack })
	};
	let current: PreparedSample[] = [];
	let startUs = 0;
	for (const sample of samples) {
		if (current.length && sample.timestampUs - startUs >= 500_000) {
			track.chunks.push({ track, samples: current, startUs, offset: 0 });
			current = [];
		}
		if (!current.length) startUs = sample.timestampUs;
		current.push(sample);
	}
	if (current.length)
		track.chunks.push({ track, samples: current, startUs, offset: 0 });
	return track;
}

function ftyp(): Uint8Array {
	return new ByteWriter()
		.box('ftyp', (box) =>
			box
				.fourcc('isom')
				.u32(0x200)
				.fourcc('isom')
				.fourcc('iso2')
				.fourcc('avc1')
				.fourcc('mp41')
		)
		.finish();
}

/** Writes a non-fragmented, faststart MP4 with time-interleaved half-second chunks. */
export function muxMp4(input: MuxInput): Uint8Array {
	if (!input.video && !input.audio)
		throw new Error('at least one track is required');
	const tracks: PreparedTrack[] = [];
	if (input.video)
		tracks.push(prepareTrack(tracks.length + 1, 'video', input.video));
	if (input.audio)
		tracks.push(prepareTrack(tracks.length + 1, 'audio', input.audio));
	const chunks = tracks
		.flatMap((track) => track.chunks)
		.sort(
			(left, right) =>
				left.startUs - right.startUs || left.track.id - right.track.id
		);
	const fileType = ftyp();
	let forceCo64 = false;
	let moov = makeMoov(tracks, forceCo64);
	for (let pass = 0; pass < 3; pass += 1) {
		const payloadLength = chunks.reduce(
			(total, chunk) =>
				total +
				chunk.samples.reduce((sum, sample) => sum + sample.data.length, 0),
			0
		);
		const mdatHeaderSize = payloadLength + 8 > 0xffff_ffff ? 16 : 8;
		let offset = fileType.length + moov.length + mdatHeaderSize;
		for (const chunk of chunks) {
			chunk.offset = offset;
			offset += chunk.samples.reduce(
				(total, sample) => total + sample.data.length,
				0
			);
		}
		const needsCo64 = chunks.some((chunk) => chunk.offset > 0xffff_ffff);
		const next = makeMoov(tracks, needsCo64);
		if (needsCo64 === forceCo64 && next.length === moov.length) {
			moov = next;
			break;
		}
		forceCo64 = needsCo64;
		moov = next;
	}
	const payloadLength = chunks.reduce(
		(total, chunk) =>
			total +
			chunk.samples.reduce((sum, sample) => sum + sample.data.length, 0),
		0
	);
	const output = new ByteWriter(
		fileType.length + moov.length + payloadLength + 16
	)
		.bytes(fileType)
		.bytes(moov);
	if (payloadLength + 8 > 0xffff_ffff)
		output
			.u32(1)
			.fourcc('mdat')
			.u64(payloadLength + 16);
	else output.u32(payloadLength + 8).fourcc('mdat');
	for (const chunk of chunks)
		for (const sample of chunk.samples) output.bytes(sample.data);
	return output.finish();
}
