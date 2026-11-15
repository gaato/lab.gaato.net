import { describe, expect, it } from 'vitest';

import { validateVideoWorkerRequest } from './video-worker';

describe('video worker protocol', () => {
	it('preserves request IDs on malformed requests', () => {
		expect(validateVideoWorkerRequest({ requestId: 'bad' })).toEqual({
			ok: false,
			response: {
				type: 'error',
				requestId: 'bad',
				error: {
					code: 'invalid_request',
					message: 'expected a valid video worker request'
				}
			}
		});
	});

	it('accepts cancellation without a File', () => {
		expect(
			validateVideoWorkerRequest({ type: 'cancel', requestId: 3 })
		).toEqual({
			ok: true,
			request: { type: 'cancel', requestId: 3 }
		});
	});

	it('rejects invalid encode ranges', () => {
		// Node does not expose File in every supported version, so malformed range
		// validation is covered through a temporary compatible constructor.
		const previous = globalThis.File;
		class TestFile {}
		Object.defineProperty(globalThis, 'File', {
			value: TestFile,
			configurable: true
		});
		try {
			expect(
				validateVideoWorkerRequest({
					type: 'encode',
					requestId: 1,
					file: new TestFile(),
					targetBytes: 10,
					trimStartUs: 10,
					trimEndUs: 5,
					keepAudio: true,
					aacEncodeSupported: false
				})
			).toMatchObject({
				ok: false,
				response: { error: { code: 'invalid_request' } }
			});
		} finally {
			Object.defineProperty(globalThis, 'File', {
				value: previous,
				configurable: true
			});
		}
	});
});
