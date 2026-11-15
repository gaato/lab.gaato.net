import { MediaError } from './mp4-demux';
import {
	cancelTranscode,
	createCancellationToken,
	inspectVideo,
	TranscodeError,
	transcodeVideo,
	type CancellationToken
} from './transcode';
import {
	validateVideoWorkerRequest,
	type VideoWorkerErrorCode,
	type VideoWorkerRequest,
	type VideoWorkerResponse
} from './video-worker';

type WorkerScope = {
	addEventListener(
		type: 'message',
		listener: (event: MessageEvent<VideoWorkerRequest>) => void
	): void;
	postMessage(message: VideoWorkerResponse, transfer?: Transferable[]): void;
};

const workerScope = globalThis as unknown as WorkerScope;
const active = new Map<string | number, CancellationToken>();

function errorResponse(
	requestId: string | number,
	error: unknown
): VideoWorkerResponse {
	if (error instanceof MediaError || error instanceof TranscodeError) {
		return {
			type: 'error',
			requestId,
			error: {
				code: error.code as VideoWorkerErrorCode,
				message: error.message,
				detail: error.detail
			}
		};
	}
	return {
		type: 'error',
		requestId,
		error: {
			code: 'internal',
			message:
				error instanceof Error ? error.message : 'video compression failed'
		}
	};
}

workerScope.addEventListener('message', (event) => {
	const validated = validateVideoWorkerRequest(event.data);
	if (!validated.ok) {
		workerScope.postMessage(validated.response);
		return;
	}
	const request = validated.request;
	if (request.type === 'cancel') {
		const token = active.get(request.requestId);
		if (token) cancelTranscode(token);
		return;
	}
	void (async () => {
		try {
			if (request.type === 'inspect') {
				workerScope.postMessage({
					type: 'progress',
					requestId: request.requestId,
					phase: 'inspect',
					fraction: 0
				});
				const info = await inspectVideo(request.file);
				workerScope.postMessage({
					type: 'info',
					requestId: request.requestId,
					info
				});
				return;
			}
			const token = createCancellationToken();
			active.set(request.requestId, token);
			const result = await transcodeVideo(request.file, {
				targetBytes: request.targetBytes,
				trimStartUs: request.trimStartUs,
				trimEndUs: request.trimEndUs,
				keepAudio: request.keepAudio,
				aacEncodeSupported: request.aacEncodeSupported,
				cancellation: token,
				onProgress: (phase, fraction) =>
					workerScope.postMessage({
						type: 'progress',
						requestId: request.requestId,
						phase,
						fraction
					}),
				onPlan: (plan) =>
					workerScope.postMessage({
						type: 'plan',
						requestId: request.requestId,
						plan
					})
			});
			workerScope.postMessage(
				{ type: 'result', requestId: request.requestId, ...result },
				[result.mp4.buffer as ArrayBuffer]
			);
		} catch (error) {
			workerScope.postMessage(errorResponse(request.requestId, error));
		} finally {
			active.delete(request.requestId);
		}
	})();
});
