import {
	processJellyGifWorkerRequest,
	type JellyGifWorkerRequest,
	type JellyGifWorkerResponse
} from './wobble-worker';

type WorkerScope = {
	addEventListener(
		type: 'message',
		listener: (event: MessageEvent<JellyGifWorkerRequest>) => void
	): void;
	postMessage(message: JellyGifWorkerResponse, transfer?: Transferable[]): void;
};

const workerScope = globalThis as unknown as WorkerScope;

workerScope.addEventListener('message', (event) => {
	const response = processJellyGifWorkerRequest(event.data, (progress) =>
		workerScope.postMessage(progress)
	);
	workerScope.postMessage(
		response,
		response.type === 'result'
			? [response.gif.buffer as ArrayBuffer]
			: undefined
	);
});
