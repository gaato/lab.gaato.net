import type { RgbaImage } from './warp';

export interface Quantized {
	palette: Uint8Array;
	paletteSize: number;
	transparentIndex: 0;
	frames: Uint8Array[];
}

export interface PaletteMapper {
	palette: Uint8Array;
	paletteSize: number;
	transparentIndex: 0;
	map(frame: RgbaImage, target?: Uint8Array): Uint8Array;
}

interface ColourBox {
	bins: number[];
	population: number;
	redRange: number;
	greenRange: number;
	blueRange: number;
}

function paletteSizeFor(colourCount: number): number {
	let size = 2;
	while (size < colourCount + 1) {
		size *= 2;
	}
	return size;
}

function validateFrame(frame: RgbaImage): void {
	if (
		!Number.isInteger(frame.width) ||
		!Number.isInteger(frame.height) ||
		frame.width < 0 ||
		frame.height < 0 ||
		frame.data.length !== frame.width * frame.height * 4
	) {
		throw new RangeError('frame dimensions and RGBA data length must agree');
	}
}

function makeBox(bins: number[], counts: Uint32Array): ColourBox {
	let population = 0;
	let minimumRed = 31;
	let maximumRed = 0;
	let minimumGreen = 31;
	let maximumGreen = 0;
	let minimumBlue = 31;
	let maximumBlue = 0;

	for (const bin of bins) {
		const red = bin >>> 10;
		const green = (bin >>> 5) & 31;
		const blue = bin & 31;
		population += counts[bin];
		minimumRed = Math.min(minimumRed, red);
		maximumRed = Math.max(maximumRed, red);
		minimumGreen = Math.min(minimumGreen, green);
		maximumGreen = Math.max(maximumGreen, green);
		minimumBlue = Math.min(minimumBlue, blue);
		maximumBlue = Math.max(maximumBlue, blue);
	}

	return {
		bins,
		population,
		redRange: maximumRed - minimumRed,
		greenRange: maximumGreen - minimumGreen,
		blueRange: maximumBlue - minimumBlue
	};
}

function splitBox(
	box: ColourBox,
	counts: Uint32Array
): [ColourBox, ColourBox] | null {
	if (box.bins.length < 2) {
		return null;
	}

	let shift = 10;
	if (box.greenRange > box.redRange && box.greenRange >= box.blueRange) {
		shift = 5;
	} else if (box.blueRange > box.redRange && box.blueRange > box.greenRange) {
		shift = 0;
	}
	const sorted = box.bins.slice().sort((left, right) => {
		const leftValue = (left >>> shift) & 31;
		const rightValue = (right >>> shift) & 31;
		return leftValue - rightValue || left - right;
	});
	const midpoint = box.population / 2;
	let accumulated = 0;
	let splitAt = 1;
	for (let index = 0; index < sorted.length - 1; index += 1) {
		accumulated += counts[sorted[index]];
		splitAt = index + 1;
		if (accumulated >= midpoint) {
			break;
		}
	}

	return [
		makeBox(sorted.slice(0, splitAt), counts),
		makeBox(sorted.slice(splitAt), counts)
	];
}

function makeMapper(
	colours: Array<[number, number, number]>,
	exactIndices?: Map<number, number>
): PaletteMapper {
	const paletteSize = paletteSizeFor(colours.length);
	const palette = new Uint8Array(paletteSize * 3);
	for (let index = 0; index < colours.length; index += 1) {
		palette.set(colours[index], (index + 1) * 3);
	}
	const cache = new Int16Array(32768);
	cache.fill(-1);

	return {
		palette,
		paletteSize,
		transparentIndex: 0,
		map(frame: RgbaImage, target?: Uint8Array): Uint8Array {
			validateFrame(frame);
			const pixelCount = frame.width * frame.height;
			if (target !== undefined && target.length !== pixelCount) {
				throw new RangeError(`target must contain exactly ${pixelCount} bytes`);
			}
			const indices = target ?? new Uint8Array(pixelCount);
			for (let pixel = 0; pixel < pixelCount; pixel += 1) {
				const offset = pixel * 4;
				if (frame.data[offset + 3] < 128) {
					indices[pixel] = 0;
					continue;
				}
				const red = frame.data[offset];
				const green = frame.data[offset + 1];
				const blue = frame.data[offset + 2];
				const rgb = (red << 16) | (green << 8) | blue;
				const exact = exactIndices?.get(rgb);
				if (exact !== undefined) {
					indices[pixel] = exact;
					continue;
				}
				const key = ((red >>> 3) << 10) | ((green >>> 3) << 5) | (blue >>> 3);
				let nearest = cache[key];
				if (nearest < 0) {
					let shortestDistance = Number.POSITIVE_INFINITY;
					nearest = 1;
					for (let candidate = 1; candidate <= colours.length; candidate += 1) {
						const paletteOffset = candidate * 3;
						const redDistance = red - palette[paletteOffset];
						const greenDistance = green - palette[paletteOffset + 1];
						const blueDistance = blue - palette[paletteOffset + 2];
						const distance =
							redDistance * redDistance +
							greenDistance * greenDistance +
							blueDistance * blueDistance;
						if (distance < shortestDistance) {
							shortestDistance = distance;
							nearest = candidate;
						}
					}
					cache[key] = nearest;
				}
				indices[pixel] = nearest;
			}
			return indices;
		}
	};
}

export class PaletteBuilder {
	private exactColours: Map<number, number> | null = new Map();
	private readonly counts = new Uint32Array(32768);
	private readonly redSums = new Float64Array(32768);
	private readonly greenSums = new Float64Array(32768);
	private readonly blueSums = new Float64Array(32768);

	add(frame: RgbaImage): void {
		validateFrame(frame);
		const pixelCount = frame.width * frame.height;
		for (let pixel = 0; pixel < pixelCount; pixel += 1) {
			const offset = pixel * 4;
			if (frame.data[offset + 3] < 128) {
				continue;
			}
			const red = frame.data[offset];
			const green = frame.data[offset + 1];
			const blue = frame.data[offset + 2];
			if (this.exactColours !== null) {
				const rgb = (red << 16) | (green << 8) | blue;
				this.exactColours.set(rgb, (this.exactColours.get(rgb) ?? 0) + 1);
				if (this.exactColours.size > 255) {
					this.exactColours = null;
				}
			}
			const bin = ((red >>> 3) << 10) | ((green >>> 3) << 5) | (blue >>> 3);
			this.counts[bin] += 1;
			this.redSums[bin] += red;
			this.greenSums[bin] += green;
			this.blueSums[bin] += blue;
		}
	}

	build(): PaletteMapper {
		if (this.exactColours !== null) {
			const colours: Array<[number, number, number]> = [];
			const exactIndices = new Map<number, number>();
			for (const rgb of this.exactColours.keys()) {
				colours.push([rgb >>> 16, (rgb >>> 8) & 255, rgb & 255]);
				exactIndices.set(rgb, colours.length);
			}
			return makeMapper(colours, exactIndices);
		}

		const occupied: number[] = [];
		for (let bin = 0; bin < this.counts.length; bin += 1) {
			if (this.counts[bin] > 0) {
				occupied.push(bin);
			}
		}
		const boxes = occupied.length === 0 ? [] : [makeBox(occupied, this.counts)];
		while (boxes.length < 255) {
			let selected = -1;
			let selectedScore = -1;
			for (let index = 0; index < boxes.length; index += 1) {
				const box = boxes[index];
				if (box.bins.length < 2) {
					continue;
				}
				const score =
					Math.max(box.redRange, box.greenRange, box.blueRange) *
					box.population;
				if (score > selectedScore) {
					selected = index;
					selectedScore = score;
				}
			}
			if (selected < 0) {
				break;
			}
			const split = splitBox(boxes[selected], this.counts);
			if (split === null) {
				break;
			}
			boxes.splice(selected, 1, ...split);
		}

		const colours: Array<[number, number, number]> = boxes.map((box) => {
			let red = 0;
			let green = 0;
			let blue = 0;
			for (const bin of box.bins) {
				red += this.redSums[bin];
				green += this.greenSums[bin];
				blue += this.blueSums[bin];
			}
			return [
				Math.round(red / box.population),
				Math.round(green / box.population),
				Math.round(blue / box.population)
			];
		});
		return makeMapper(colours);
	}
}

export function quantizeFrames(frames: RgbaImage[]): Quantized {
	const builder = new PaletteBuilder();
	for (const frame of frames) {
		builder.add(frame);
	}
	const mapper = builder.build();
	return {
		palette: mapper.palette,
		paletteSize: mapper.paletteSize,
		transparentIndex: 0,
		frames: frames.map((frame) => mapper.map(frame))
	};
}
