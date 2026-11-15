import { describe, expect, it } from 'vitest';

import { nextAttemptBitrate, planEncode } from './plan';

const base = {
	durationUs: 10_000_000,
	width: 1920,
	height: 1080,
	fps: 60,
	rotation: 0 as const,
	targetBytes: 20 * 1024 * 1024,
	audioPresent: true,
	audioSourceBitrate: 64_000,
	audioCodec: 'mp4a.40.2',
	keepAudio: true,
	aacEncodeSupported: true
};

describe('encode planning', () => {
	it('caps an unchanged small source at its video bitrate', () => {
		const plan = planEncode({
			...base,
			width: 320,
			height: 240,
			fps: 30,
			durationUs: 2_000_000,
			targetBytes: 5 * 1024 * 1024,
			audioPresent: false,
			videoSourceBitrate: 180_000
		});
		expect(plan).toMatchObject({
			width: 320,
			height: 240,
			fps: 30,
			videoBitrate: 180_000
		});
	});

	it('caps excessive budgets at 0.3 bits per pixel per frame', () => {
		const plan = planEncode({
			...base,
			width: 320,
			height: 240,
			fps: 30,
			audioPresent: false,
			videoSourceBitrate: 10_000_000
		});
		expect(plan.videoBitrate).toBe(320 * 240 * 30 * 0.3);
	});

	it('honours source bitrates below the normal retry floor', () => {
		const plan = planEncode({ ...base, videoSourceBitrate: 20_000 });
		expect(plan.videoBitrate).toBe(20_000);
		expect(nextAttemptBitrate(plan.videoBitrate, 100, 50)).toBeLessThanOrEqual(
			20_000
		);
	});
	it('chooses the largest quality rung without upscaling', () => {
		const plan = planEncode(base);
		expect(plan.width).toBe(1920);
		expect(plan.height).toBe(1080);
		expect(plan.fps).toBe(60);
		expect(plan.audioMode).toBe('copy');
		expect(plan.videoBitrate).toBeGreaterThan(1_000_000);
		expect(plan.tooSmall).toBe(false);
	});

	it('drops frame rate and falls back to Opus under a small budget', () => {
		const plan = planEncode({
			...base,
			durationUs: 2_000_000,
			width: 320,
			height: 240,
			fps: 30,
			targetBytes: 0.03 * 1024 * 1024,
			audioSourceBitrate: 64_000,
			aacEncodeSupported: false
		});
		expect(plan).toMatchObject({
			width: 320,
			height: 240,
			fps: 15,
			audioMode: 'encode-opus',
			audioBitrate: 32_000
		});
		expect(plan.videoBitrate).toBeGreaterThanOrEqual(32_000);
	});

	it('accounts for display rotation while preserving coded orientation', () => {
		const plan = planEncode({
			...base,
			width: 3840,
			height: 2160,
			rotation: 90,
			targetBytes: 3_000_000
		});
		expect(plan.width % 2).toBe(0);
		expect(plan.height % 2).toBe(0);
		expect(plan.width).toBeGreaterThan(plan.height);
		expect(plan.width).toBeLessThanOrEqual(3840);
	});

	it('removes audio and reports targets below the documented floor', () => {
		const plan = planEncode({ ...base, targetBytes: 1000, keepAudio: false });
		expect(plan.audioMode).toBe('none');
		expect(plan.audioBitrate).toBe(0);
		expect(plan.tooSmall).toBe(true);
		expect(plan.minimumFeasibleBytes).toBeGreaterThan(1000);
	});

	it('scales retries proportionally with headroom and never increases', () => {
		expect(nextAttemptBitrate(1_000_000, 1_200_000, 1_000_000)).toBe(783_333);
		expect(nextAttemptBitrate(100_000, 50_000, 100_000)).toBe(99_999);
		expect(nextAttemptBitrate(10_000, 0, 100)).toBe(32_000);
	});
});
