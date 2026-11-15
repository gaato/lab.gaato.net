import type { EncodePlan } from './plan';

export type VideoWorkerPhase =
	'inspect' | 'audio' | 'decode' | 'encode' | 'mux';

export interface VideoSourceInfo {
	durationUs: number;
	video: {
		codec: string;
		width: number;
		height: number;
		rotation: 0 | 90 | 180 | 270;
		fps: number;
		bitrate: number;
	};
	audio?: {
		codec: string;
		channelCount: number;
		sampleRate: number;
		bitrate: number;
	};
}

export type VideoWorkerRequest =
	| { type: 'inspect'; requestId: string | number; file: File }
	| {
			type: 'encode';
			requestId: string | number;
			file: File;
			targetBytes: number;
			trimStartUs: number;
			trimEndUs: number;
			keepAudio: boolean;
			aacEncodeSupported: boolean;
	  }
	| { type: 'cancel'; requestId: string | number };

export type VideoWorkerErrorCode =
	| 'invalid_request'
	| 'container_unsupported'
	| 'fragmented_unsupported'
	| 'codec_unsupported'
	| 'decode_unsupported'
	| 'encode_unsupported'
	| 'cancelled'
	| 'internal';

export type VideoWorkerResponse =
	| { type: 'info'; requestId: string | number; info: VideoSourceInfo }
	| {
			type: 'progress';
			requestId: string | number;
			phase: VideoWorkerPhase;
			fraction: number;
	  }
	| {
			type: 'plan';
			requestId: string | number;
			plan: EncodePlan;
	  }
	| {
			type: 'result';
			requestId: string | number;
			mp4: Uint8Array;
			plan: EncodePlan;
			attempts: number;
			exceededTarget: boolean;
	  }
	| {
			type: 'error';
			requestId: string | number;
			error: { code: VideoWorkerErrorCode; message: string; detail?: string };
	  };

function requestIdFrom(value: unknown): string | number {
	if (
		typeof value === 'object' &&
		value !== null &&
		'requestId' in value &&
		(typeof value.requestId === 'string' || typeof value.requestId === 'number')
	)
		return value.requestId;
	return 'unknown';
}

function isFile(value: unknown): value is File {
	return typeof File !== 'undefined' && value instanceof File;
}

export function validateVideoWorkerRequest(
	value: unknown
):
	| { ok: true; request: VideoWorkerRequest }
	| { ok: false; response: VideoWorkerResponse } {
	const requestId = requestIdFrom(value);
	if (typeof value !== 'object' || value === null || !('type' in value))
		return invalid(requestId);
	if (value.type === 'cancel')
		return { ok: true, request: { type: 'cancel', requestId } };
	if (!('file' in value) || !isFile(value.file)) return invalid(requestId);
	if (value.type === 'inspect')
		return {
			ok: true,
			request: { type: 'inspect', requestId, file: value.file }
		};
	if (
		value.type !== 'encode' ||
		!('targetBytes' in value) ||
		typeof value.targetBytes !== 'number' ||
		!Number.isFinite(value.targetBytes) ||
		value.targetBytes <= 0 ||
		!('trimStartUs' in value) ||
		typeof value.trimStartUs !== 'number' ||
		value.trimStartUs < 0 ||
		!('trimEndUs' in value) ||
		typeof value.trimEndUs !== 'number' ||
		value.trimEndUs <= value.trimStartUs ||
		!('keepAudio' in value) ||
		typeof value.keepAudio !== 'boolean' ||
		!('aacEncodeSupported' in value) ||
		typeof value.aacEncodeSupported !== 'boolean'
	)
		return invalid(requestId);
	return { ok: true, request: value as VideoWorkerRequest };
}

function invalid(requestId: string | number) {
	return {
		ok: false as const,
		response: {
			type: 'error' as const,
			requestId,
			error: {
				code: 'invalid_request' as const,
				message: 'expected a valid video worker request'
			}
		}
	};
}
