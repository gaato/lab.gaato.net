import {
	processHighLowWorkerRequest,
	type HighLowWorkerRequest,
	type HighLowWorkerResponse
} from './high-low-worker';

type WorkerScope = {
	addEventListener(
		type: 'message',
		listener: (event: MessageEvent<HighLowWorkerRequest>) => void
	): void;
	postMessage(message: HighLowWorkerResponse): void;
};

const workerScope = globalThis as unknown as WorkerScope;

workerScope.addEventListener('message', (event) => {
	workerScope.postMessage(processHighLowWorkerRequest(event.data));
});
