import { afterEach, describe, expect, it, vi } from 'vitest';

import { copyAudioData } from './audio';

afterEach(() => vi.unstubAllGlobals());

function copy(planes: number[][], timestamp = 1234): AudioDataInit {
	let output: AudioDataInit | undefined;
	vi.stubGlobal(
		'AudioData',
		class {
			constructor(init: AudioDataInit) {
				output = init;
			}
		}
	);
	copyAudioData(
		{
			numberOfChannels: planes.length,
			numberOfFrames: planes[0].length,
			sampleRate: 44100,
			copyTo(target: Float32Array, { planeIndex }: { planeIndex: number }) {
				target.set(planes[planeIndex]);
			}
		} as AudioData,
		timestamp
	);
	return output!;
}

describe('audio PCM copy', () => {
	it('preserves 44.1 kHz stereo samples and rebases in a single AudioData allocation', () => {
		const output = copy(
			[
				[0.5, -0.25],
				[1, -1]
			],
			100
		);
		expect(output).toMatchObject({
			sampleRate: 44100,
			numberOfChannels: 2,
			numberOfFrames: 2,
			timestamp: 100
		});
		expect(Array.from(output.data as Float32Array)).toEqual([
			0.5, -0.25, 1, -1
		]);
	});

	it('mixes the 5.1 centre into both sides and keeps surrounds on their respective sides', () => {
		const output = copy([
			[1, 0, 0, 0, 0, 0],
			[0, 1, 0, 0, 0, 0],
			[0, 0, 1, 0, 0, 0],
			[0, 0, 0, 1, 0, 0],
			[0, 0, 0, 0, 1, 0],
			[0, 0, 0, 0, 0, 1]
		]);
		const values = output.data as Float32Array;
		expect(output.numberOfChannels).toBe(2);
		expect(values[2]).toBeGreaterThan(0);
		expect(values[2]).toBe(values[8]);
		expect(values[0]).toBeGreaterThan(0);
		expect(values[1]).toBe(0);
		expect(values[6]).toBe(0);
		expect(values[7]).toBeGreaterThan(0);
		expect(values[3]).toBe(0);
		expect(values[9]).toBe(0);
		expect(values[4]).toBeGreaterThan(0);
		expect(values[10]).toBe(0);
		expect(values[5]).toBe(0);
		expect(values[11]).toBeGreaterThan(0);
	});
});
