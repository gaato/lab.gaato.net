/** Copy PCM once, preserving its rate and rebasing its timestamp for the encoder. */
export function copyAudioData(frame: AudioData, timestamp: number): AudioData {
	const channels = Math.min(2, frame.numberOfChannels);
	const frames = frame.numberOfFrames;
	const data = new Float32Array(frames * channels);
	if (frame.numberOfChannels <= 2) {
		for (let channel = 0; channel < channels; channel += 1)
			frame.copyTo(data.subarray(channel * frames, (channel + 1) * frames), {
				planeIndex: channel,
				format: 'f32-planar'
			});
	} else {
		// Surround order: L R C LFE Ls Rs (quad omits C/LFE; 5.0 omits LFE).
		// Centre belongs in both sides; omit LFE and normalize to avoid clipping.
		const surround = Math.SQRT1_2;
		const hasCentre = frame.numberOfChannels !== 4;
		const weights = Array.from(
			{ length: frame.numberOfChannels },
			(_, channel) => {
				if (channel === 0) return [1, 0];
				if (channel === 1) return [0, 1];
				if (channel === 2 && hasCentre) return [surround, surround];
				if (channel === 3 && frame.numberOfChannels >= 6) return [0, 0];
				const firstSurround =
					frame.numberOfChannels >= 6 ? 4 : hasCentre ? 3 : 2;
				return (channel - firstSurround) % 2 === 0
					? [surround, 0]
					: [0, surround];
			}
		);
		const gain =
			1 /
			Math.max(
				...[0, 1].map((side) =>
					weights.reduce((sum, weight) => sum + weight[side], 0)
				)
			);
		const plane = new Float32Array(frames);
		for (let channel = 0; channel < frame.numberOfChannels; channel += 1) {
			frame.copyTo(plane, { planeIndex: channel, format: 'f32-planar' });
			for (let side = 0; side < 2; side += 1)
				for (let index = 0; index < frames; index += 1)
					data[side * frames + index] +=
						plane[index] * weights[channel][side] * gain;
		}
	}
	return new AudioData({
		format: 'f32-planar',
		sampleRate: frame.sampleRate,
		numberOfFrames: frames,
		numberOfChannels: channels,
		timestamp,
		data
	});
}
