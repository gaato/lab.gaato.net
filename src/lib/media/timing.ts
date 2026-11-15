/** A rounded UI end within 1 ms of the source end means the whole video. */
export function trimEndUs(endSeconds: number, durationUs: number): number {
	const endUs = Math.round(endSeconds * 1_000_000);
	return endUs >= durationUs - 1000 ? durationUs : endUs;
}

/** Returns source indices in presentation order, including only trimmed frames. */
export function selectFrameIndices(
	timestampsUs: number[],
	startUs: number,
	endUs: number,
	sourceFps: number,
	plannedFps: number
): number[] {
	const candidates = timestampsUs
		.map((timestamp, index) => ({ timestamp, index }))
		.filter(({ timestamp }) => timestamp >= startUs && timestamp < endUs)
		.sort((a, b) => a.timestamp - b.timestamp);
	// Small estimate differences (including 29.97 vs 30) are not a rate change.
	if (plannedFps >= sourceFps * 0.99)
		return candidates.map(({ index }) => index);
	const interval = 1_000_000 / plannedFps;
	const selected: number[] = [];
	let lastSlot = -1;
	let lastDistance = Infinity;
	for (const { timestamp, index } of candidates) {
		// Assign to the nearest grid point, allowing half an interval of jitter.
		const slot = Math.floor((timestamp - startUs) / interval + 0.5);
		const gridTime = startUs + slot * interval;
		if (gridTime >= endUs) continue;
		const distance = Math.abs(timestamp - gridTime);
		if (slot > lastSlot) {
			selected.push(index);
			lastSlot = slot;
			lastDistance = distance;
		} else if (distance < lastDistance) {
			// Prefer the closest frame rather than the first early arrival in a slot.
			selected[selected.length - 1] = index;
			lastDistance = distance;
		}
	}
	return selected;
}
