<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import JellyGifWorker from '$lib/wobble.worker?worker';
	import { locale, translate, type MessageKey } from '$lib/i18n';
	import RangeField from '$lib/RangeField.svelte';
	import { compositeInPlace, type Background } from '$lib/wobble/composite';
	import {
		DEFAULT_SETTINGS,
		MAX_SPEED_HZ,
		MAX_SOURCE_EDGE,
		MIN_SPEED_HZ,
		estimateGifBytes,
		frameCountForSpeed,
		loopDurationMs,
		normalizeSettings,
		speedHz,
		type WobbleDirection,
		type WobbleMode,
		type WobbleSettings
	} from '$lib/wobble/settings';
	import { outputSize, renderFrame, type RgbaImage } from '$lib/wobble/warp';
	import type { JellyGifWorkerResponse } from '$lib/wobble-worker';

	// Per-pixel rendering hot loops must read plain objects, not deep proxies.
	let source = $state.raw<RgbaImage | null>(null);
	let sourceName = $state('');
	let settings = $state.raw<WobbleSettings>({
		...DEFAULT_SETTINGS,
		cycles: 1,
		frameCount: frameCountForSpeed(DEFAULT_SETTINGS.delayCentiseconds, 1)
	});
	let targetHz = $state(1);
	let playing = $state(false);
	let reducedMotion = $state(false);
	let encoding = $state(false);
	let progress = $state<{ completed: number; total: number } | null>(null);
	let resultUrl = $state<string | null>(null);
	let resultBytes = $state(0);
	let errorKey = $state<MessageKey | null>(null);
	let statusKey = $state<MessageKey | null>(null);
	let dragging = $state(false);
	let videoMimeType = $state<string | null>(null);
	let videoSupported = $state(false);
	let backgroundMode = $state<'none' | 'color' | 'image'>('none');
	let backgroundColor = $state('#ffffff');
	let backgroundSource = $state.raw<RgbaImage | null>(null);
	let backgroundName = $state('');
	let canShareFiles = $state(false);
	let recording = $state(false);
	let videoProgress = $state<{ completed: number; total: number } | null>(null);
	let videoUrl = $state<string | null>(null);
	let videoBytes = $state(0);
	let videoResultMimeType = $state<string | null>(null);

	const size = $derived(source ? outputSize(source, settings) : null);
	const estimatedBytes = $derived(
		size ? estimateGifBytes(size.width, size.height, settings.frameCount) : 0
	);
	const loopSeconds = $derived(loopDurationMs(settings) / 1000);
	const achievedHz = $derived(speedHz(settings));
	const downloadName = $derived(makeDownloadName(sourceName));
	const videoDownloadName = $derived(
		makeVideoDownloadName(sourceName, videoResultMimeType ?? videoMimeType)
	);

	let canvas = $state<HTMLCanvasElement>();
	let downloadLink = $state<HTMLAnchorElement>();
	let worker: Worker | null = null;
	let requestSequence = 0;
	let animationFrame: number | null = null;
	let startedAt = 0;
	let lastFrameIndex = -1;
	let lastSource: RgbaImage | null = null;
	let lastSettings: WobbleSettings | null = null;
	let previewBuffer: Uint8ClampedArray<ArrayBuffer> | null = null;
	let previewImageData: ImageData | null = null;
	let previewWidth = 0;
	let previewHeight = 0;
	let cachedBackgroundSource: RgbaImage | null = null;
	let backgroundLayer: RgbaImage | null = null;
	let cachedBackgroundWidth = 0;
	let cachedBackgroundHeight = 0;
	let resultBlob: Blob | null = null;
	let videoBlob: Blob | null = null;
	type CaptureTrack = MediaStreamTrack & { requestFrame?: () => void };
	type VideoRecording = {
		recorder: MediaRecorder;
		track: CaptureTrack;
		chunks: Blob[];
		cancelled: boolean;
		timeout: number | null;
		wake: (() => void) | null;
	};
	let activeRecording: VideoRecording | null = null;

	onMount(() => {
		try {
			canShareFiles =
				typeof navigator.canShare === 'function' &&
				navigator.canShare({
					files: [
						new File([new Uint8Array([71])], 'probe.gif', {
							type: 'image/gif'
						})
					]
				});
		} catch {
			canShareFiles = false;
		}
		videoMimeType =
			[
				'video/webm;codecs=vp9',
				'video/webm;codecs=vp8',
				'video/webm',
				'video/mp4'
			].find(
				(type) =>
					typeof MediaRecorder !== 'undefined' &&
					MediaRecorder.isTypeSupported(type)
			) ?? null;
		videoSupported =
			videoMimeType !== null &&
			typeof HTMLCanvasElement.prototype.captureStream === 'function';

		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion = motionQuery.matches;

		const handleMotionChange = (event: MediaQueryListEvent): void => {
			reducedMotion = event.matches;
			if (event.matches) {
				playing = false;
				stopAnimation();
			}
		};
		const handlePaste = (event: ClipboardEvent): void => {
			const file = Array.from(event.clipboardData?.files ?? []).find((item) =>
				item.type.startsWith('image/')
			);
			const itemFile = Array.from(event.clipboardData?.items ?? [])
				.find((item) => item.kind === 'file' && item.type.startsWith('image/'))
				?.getAsFile();
			const imageFile = file ?? itemFile;
			if (imageFile) void loadFile(imageFile);
		};
		const handleVisibilityChange = (): void => {
			if (document.hidden) {
				stopAnimation();
				if (recording) cancelRecording('jellyGif.videoInterrupted');
			} else if (playing) {
				startAnimation();
			}
		};

		motionQuery.addEventListener('change', handleMotionChange);
		window.addEventListener('paste', handlePaste);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			motionQuery.removeEventListener('change', handleMotionChange);
			window.removeEventListener('paste', handlePaste);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	onDestroy(() => {
		stopWorker();
		stopAnimation();
		cancelRecording();
		if (resultUrl) URL.revokeObjectURL(resultUrl);
		if (videoUrl) URL.revokeObjectURL(videoUrl);
	});

	function makeDownloadName(name: string): string {
		const basename = name.replace(/\.[^.]*$/, '').trim();
		return basename ? `jelly-${basename}.gif` : 'jelly.gif';
	}

	function makeVideoDownloadName(
		name: string,
		mimeType: string | null
	): string {
		const basename = name.replace(/\.[^.]*$/, '').trim();
		const extension = mimeType?.startsWith('video/mp4') ? 'mp4' : 'webm';
		return basename ? `jelly-${basename}.${extension}` : `jelly.${extension}`;
	}

	function formatBytes(bytes: number): string {
		const useKilobytes = bytes >= 1024;
		return new Intl.NumberFormat($locale, {
			style: 'unit',
			unit: useKilobytes ? 'kilobyte' : 'byte',
			maximumFractionDigits: 0
		}).format(useKilobytes ? bytes / 1024 : bytes);
	}

	function formatFps(delayCentiseconds: number): string {
		return new Intl.NumberFormat($locale, {
			maximumFractionDigits: 1
		}).format(100 / delayCentiseconds);
	}

	function formatTwoDecimals(value: number): string {
		return new Intl.NumberFormat($locale, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(value);
	}

	function clearResult(): void {
		if (resultUrl) URL.revokeObjectURL(resultUrl);
		resultUrl = null;
		resultBytes = 0;
		resultBlob = null;
	}

	function clearVideoResult(): void {
		if (videoUrl) URL.revokeObjectURL(videoUrl);
		videoUrl = null;
		videoBytes = 0;
		videoResultMimeType = null;
		videoBlob = null;
	}

	function drawSource(
		image: CanvasImageSource,
		originalWidth: number,
		originalHeight: number,
		maxEdge = MAX_SOURCE_EDGE
	): RgbaImage {
		const scale = Math.min(
			1,
			maxEdge / Math.max(originalWidth, originalHeight)
		);
		const width = Math.max(1, Math.round(originalWidth * scale));
		const height = Math.max(1, Math.round(originalHeight * scale));
		const scratch = document.createElement('canvas');
		scratch.width = width;
		scratch.height = height;
		const context = scratch.getContext('2d', { willReadFrequently: true });
		if (!context) throw new Error('Canvas 2D context is unavailable');
		context.drawImage(image, 0, 0, width, height);
		return {
			width,
			height,
			data: context.getImageData(0, 0, width, height).data
		};
	}

	function readAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () =>
				typeof reader.result === 'string'
					? resolve(reader.result)
					: reject(new Error('Invalid image data'));
			reader.onerror = () =>
				reject(reader.error ?? new Error('Could not read image'));
			reader.readAsDataURL(file);
		});
	}

	async function decodeWithImage(
		file: File,
		maxEdge = MAX_SOURCE_EDGE
	): Promise<RgbaImage> {
		const image = new Image();
		image.src = await readAsDataUrl(file);
		await image.decode();
		return drawSource(image, image.naturalWidth, image.naturalHeight, maxEdge);
	}

	async function decodeFile(
		file: File,
		maxEdge = MAX_SOURCE_EDGE
	): Promise<RgbaImage> {
		if (typeof createImageBitmap === 'function') {
			try {
				const bitmap = await createImageBitmap(file);
				try {
					return drawSource(bitmap, bitmap.width, bitmap.height, maxEdge);
				} finally {
					bitmap.close();
				}
			} catch {
				return decodeWithImage(file, maxEdge);
			}
		}
		return decodeWithImage(file, maxEdge);
	}

	async function loadFile(file: File): Promise<void> {
		errorKey = null;
		statusKey = null;
		if (!file.type.startsWith('image/')) {
			errorKey = 'jellyGif.decodeError';
			return;
		}

		try {
			const decoded = await decodeFile(file);

			stopWorker();
			encoding = false;
			progress = null;
			clearResult();
			clearVideoResult();
			source = decoded;
			sourceName = file.name;
			invalidatePreview();
			await tick();
			if (reducedMotion) {
				playing = false;
				renderPreviewFrame(0);
			} else {
				startPreview();
			}
		} catch {
			errorKey = 'jellyGif.decodeError';
		}
	}

	function handleFileChange(event: Event): void {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (file) void loadFile(file);
	}

	async function loadBackgroundFile(file: File): Promise<void> {
		errorKey = null;
		statusKey = null;
		if (!file.type.startsWith('image/')) {
			errorKey = 'jellyGif.decodeError';
			return;
		}
		try {
			backgroundSource = await decodeFile(file, 1024);
			backgroundName = file.name;
			cachedBackgroundSource = null;
			backgroundLayer = null;
			invalidatePreview();
			if (!playing) renderPreviewFrame(0);
		} catch {
			errorKey = 'jellyGif.decodeError';
		}
	}

	function handleBackgroundFileChange(event: Event): void {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (file) void loadBackgroundFile(file);
	}

	function handleDragOver(event: DragEvent): void {
		event.preventDefault();
		dragging = true;
	}

	function handleDragLeave(event: DragEvent): void {
		const card = event.currentTarget as HTMLElement;
		if (!event.relatedTarget || !card.contains(event.relatedTarget as Node)) {
			dragging = false;
		}
	}

	function handleDrop(event: DragEvent): void {
		event.preventDefault();
		dragging = false;
		const file = event.dataTransfer?.files[0];
		if (file) void loadFile(file);
	}

	function updateSettings(values: Partial<WobbleSettings>): void {
		settings =
			normalizeSettings({ ...settings, ...values, cycles: 1 }) ?? settings;
		invalidatePreview();
		void tick().then(() => {
			if (!playing) renderPreviewFrame(0);
		});
	}

	function handleMode(event: Event): void {
		updateSettings({
			mode: (event.currentTarget as HTMLSelectElement).value as WobbleMode
		});
	}

	function handleDirection(event: Event): void {
		updateSettings({
			direction: (event.currentTarget as HTMLSelectElement)
				.value as WobbleDirection
		});
	}

	function refreshPreview(): void {
		invalidatePreview();
		void tick().then(() => {
			if (!playing) renderPreviewFrame(0);
		});
	}

	function handleBackgroundMode(event: Event): void {
		backgroundMode = (event.currentTarget as HTMLSelectElement).value as
			'none' | 'color' | 'image';
		refreshPreview();
	}

	function handleBackgroundColor(event: Event): void {
		backgroundColor = (event.currentTarget as HTMLInputElement).value;
		refreshPreview();
	}

	function colorRgb(value: string): [number, number, number] {
		return [
			Number.parseInt(value.slice(1, 3), 16),
			Number.parseInt(value.slice(3, 5), 16),
			Number.parseInt(value.slice(5, 7), 16)
		];
	}

	function backgroundLayerFor(width: number, height: number): RgbaImage | null {
		if (!backgroundSource) return null;
		if (
			cachedBackgroundSource === backgroundSource &&
			cachedBackgroundWidth === width &&
			cachedBackgroundHeight === height
		) {
			return backgroundLayer;
		}

		const sourceCanvas = document.createElement('canvas');
		sourceCanvas.width = backgroundSource.width;
		sourceCanvas.height = backgroundSource.height;
		const sourceContext = sourceCanvas.getContext('2d');
		const layerCanvas = document.createElement('canvas');
		layerCanvas.width = width;
		layerCanvas.height = height;
		const layerContext = layerCanvas.getContext('2d', {
			willReadFrequently: true
		});
		if (!sourceContext || !layerContext) return null;
		sourceContext.putImageData(
			new ImageData(
				new Uint8ClampedArray(backgroundSource.data),
				backgroundSource.width,
				backgroundSource.height
			),
			0,
			0
		);
		const scale = Math.max(
			width / backgroundSource.width,
			height / backgroundSource.height
		);
		const drawnWidth = backgroundSource.width * scale;
		const drawnHeight = backgroundSource.height * scale;
		layerContext.drawImage(
			sourceCanvas,
			(width - drawnWidth) / 2,
			(height - drawnHeight) / 2,
			drawnWidth,
			drawnHeight
		);
		cachedBackgroundSource = backgroundSource;
		cachedBackgroundWidth = width;
		cachedBackgroundHeight = height;
		backgroundLayer = {
			width,
			height,
			data: layerContext.getImageData(0, 0, width, height).data
		};
		return backgroundLayer;
	}

	function activeBackground(width: number, height: number): Background | null {
		if (backgroundMode === 'color') {
			return { type: 'color', rgb: colorRgb(backgroundColor) };
		}
		if (backgroundMode === 'image') {
			const image = backgroundLayerFor(width, height);
			return image ? { type: 'image', image } : null;
		}
		return null;
	}

	function handleNumber(key: keyof WobbleSettings, value: number): void {
		updateSettings({ [key]: value });
	}

	function handleSpeed(value: number): void {
		targetHz = value;
		updateSettings({
			frameCount: frameCountForSpeed(settings.delayCentiseconds, targetHz)
		});
	}

	function handleSpeedCommit(): void {
		targetHz = Math.round(achievedHz * 100) / 100;
	}

	function handleDelay(delayCentiseconds: number): void {
		updateSettings({
			delayCentiseconds,
			frameCount: frameCountForSpeed(delayCentiseconds, targetHz)
		});
	}

	function handleDelayCommit(): void {
		targetHz = Math.round(achievedHz * 100) / 100;
	}

	function invalidatePreview(): void {
		lastFrameIndex = -1;
		lastSource = null;
		lastSettings = null;
	}

	function ensurePreviewBuffer(
		width: number,
		height: number
	): Uint8ClampedArray<ArrayBuffer> {
		if (!previewBuffer || previewWidth !== width || previewHeight !== height) {
			previewWidth = width;
			previewHeight = height;
			previewBuffer = new Uint8ClampedArray(width * height * 4);
			previewImageData = new ImageData(previewBuffer, width, height);
		}
		return previewBuffer;
	}

	function renderPreviewFrame(frameIndex: number): void {
		if (!source || !size || !canvas) return;
		if (canvas.width !== size.width) canvas.width = size.width;
		if (canvas.height !== size.height) canvas.height = size.height;
		const buffer = ensurePreviewBuffer(size.width, size.height);
		renderFrame(source, settings, frameIndex, buffer);
		const background = activeBackground(size.width, size.height);
		if (background) {
			compositeInPlace(
				{ width: size.width, height: size.height, data: buffer },
				background
			);
		}
		const context = canvas.getContext('2d');
		if (!context || !previewImageData) return;
		context.putImageData(previewImageData, 0, 0);
		lastFrameIndex = frameIndex;
		lastSource = source;
		lastSettings = settings;
	}

	function animate(now: number): void {
		animationFrame = null;
		if (!playing || document.hidden) return;
		const frameIndex =
			Math.floor((now - startedAt) / (settings.delayCentiseconds * 10)) %
			settings.frameCount;
		if (
			frameIndex !== lastFrameIndex ||
			source !== lastSource ||
			settings !== lastSettings
		) {
			renderPreviewFrame(frameIndex);
		}
		animationFrame = requestAnimationFrame(animate);
	}

	function startAnimation(): void {
		stopAnimation();
		startedAt = performance.now();
		invalidatePreview();
		animationFrame = requestAnimationFrame(animate);
	}

	function stopAnimation(): void {
		if (animationFrame !== null) cancelAnimationFrame(animationFrame);
		animationFrame = null;
	}

	function startPreview(): void {
		if (!source) return;
		playing = true;
		startAnimation();
	}

	function togglePreview(): void {
		if (playing) {
			playing = false;
			stopAnimation();
		} else {
			startPreview();
		}
	}

	function stopWorker(): void {
		worker?.terminate();
		worker = null;
		encoding = false;
		progress = null;
	}

	function cancelGeneration(): void {
		requestSequence += 1;
		stopWorker();
		statusKey = null;
	}

	function generate(): void {
		if (!source || !size || recording) return;
		const requestId = ++requestSequence;
		let nextWorker: Worker;
		try {
			nextWorker = new JellyGifWorker();
		} catch {
			errorKey = 'jellyGif.workerUnavailable';
			statusKey = null;
			encoding = false;
			return;
		}

		worker = nextWorker;
		encoding = true;
		progress = { completed: 0, total: settings.frameCount };
		errorKey = null;
		statusKey = null;
		nextWorker.onmessage = async (
			event: MessageEvent<JellyGifWorkerResponse>
		) => {
			if (worker !== nextWorker || event.data.requestId !== requestId) return;
			if (event.data.type === 'progress') {
				progress = {
					completed: event.data.completed,
					total: event.data.total
				};
				return;
			}

			worker = null;
			nextWorker.terminate();
			encoding = false;
			progress = null;
			if (event.data.type === 'result') {
				const gif: Uint8Array<ArrayBuffer> = new Uint8Array(event.data.gif);
				const blob = new Blob([gif], { type: 'image/gif' });
				clearResult();
				resultBlob = blob;
				resultUrl = URL.createObjectURL(blob);
				resultBytes = gif.byteLength;
				statusKey = 'jellyGif.done';
				errorKey = null;
				await tick();
				downloadLink?.focus();
				return;
			}
			errorKey =
				event.data.error.code === 'image_too_large'
					? 'jellyGif.tooLarge'
					: 'jellyGif.encodeError';
			statusKey = null;
		};
		nextWorker.onerror = (event) => {
			event.preventDefault();
			if (worker !== nextWorker || requestSequence !== requestId) return;
			worker = null;
			nextWorker.terminate();
			encoding = false;
			progress = null;
			errorKey = 'jellyGif.encodeError';
			statusKey = null;
		};

		const pixels = source.data.slice().buffer;
		const activeLayer = activeBackground(size.width, size.height);
		const backgroundPixels =
			activeLayer?.type === 'image'
				? activeLayer.image.data.slice().buffer
				: null;
		const background =
			activeLayer?.type === 'color'
				? activeLayer
				: activeLayer?.type === 'image' && backgroundPixels
					? {
							type: 'image' as const,
							width: activeLayer.image.width,
							height: activeLayer.image.height,
							pixels: backgroundPixels
						}
					: undefined;
		try {
			nextWorker.postMessage(
				{
					type: 'encode',
					requestId,
					width: source.width,
					height: source.height,
					pixels,
					settings,
					background
				},
				backgroundPixels ? [pixels, backgroundPixels] : [pixels]
			);
		} catch {
			nextWorker.terminate();
			worker = null;
			encoding = false;
			progress = null;
			errorKey = 'jellyGif.encodeError';
		}
	}

	function waitForRecordingTime(
		target: number,
		session: VideoRecording
	): Promise<void> {
		return new Promise((resolve) => {
			const finish = (): void => {
				session.timeout = null;
				session.wake = null;
				resolve();
			};
			session.wake = finish;
			session.timeout = window.setTimeout(
				finish,
				Math.max(0, target - performance.now())
			);
		});
	}

	function cancelRecording(nextStatusKey: MessageKey | null = null): void {
		const session = activeRecording;
		if (!session) return;
		session.cancelled = true;
		session.chunks.length = 0;
		if (session.timeout !== null) window.clearTimeout(session.timeout);
		session.wake?.();
		recording = false;
		videoProgress = null;
		statusKey = nextStatusKey;
		if (session.recorder.state !== 'inactive') {
			session.recorder.stop();
		} else {
			session.track.stop();
			if (activeRecording === session) activeRecording = null;
		}
	}

	async function recordVideo(): Promise<void> {
		if (
			!source ||
			!size ||
			!videoMimeType ||
			!videoSupported ||
			encoding ||
			recording
		) {
			return;
		}

		const recordingSource = source;
		const recordingSettings = settings;
		const recordingSize = { ...size };
		const recordingBackground = activeBackground(
			recordingSize.width,
			recordingSize.height
		);
		const recordingBackgroundColor =
			backgroundMode === 'none' ? '#ffffff' : backgroundColor;
		const recordingMimeType = videoMimeType;
		const recordingCanvas = document.createElement('canvas');
		const scratchCanvas = document.createElement('canvas');
		recordingCanvas.width = recordingSize.width;
		recordingCanvas.height = recordingSize.height;
		scratchCanvas.width = recordingSize.width;
		scratchCanvas.height = recordingSize.height;
		const recordingContext = recordingCanvas.getContext('2d');
		const scratchContext = scratchCanvas.getContext('2d');
		if (!recordingContext || !scratchContext) {
			errorKey = 'jellyGif.encodeError';
			return;
		}

		let stream = recordingCanvas.captureStream(0);
		let track = stream.getVideoTracks()[0] as CaptureTrack | undefined;
		if (!track) {
			errorKey = 'jellyGif.encodeError';
			return;
		}
		if (typeof track.requestFrame !== 'function') {
			track.stop();
			stream = recordingCanvas.captureStream(25);
			track = stream.getVideoTracks()[0] as CaptureTrack | undefined;
			if (!track) {
				errorKey = 'jellyGif.encodeError';
				return;
			}
		}

		let recorder: MediaRecorder;
		try {
			recorder = new MediaRecorder(stream, { mimeType: recordingMimeType });
		} catch {
			track.stop();
			errorKey = 'jellyGif.encodeError';
			return;
		}

		const session: VideoRecording = {
			recorder,
			track,
			chunks: [],
			cancelled: false,
			timeout: null,
			wake: null
		};
		activeRecording = session;
		recording = true;
		videoProgress = { completed: 0, total: recordingSettings.frameCount };
		errorKey = null;
		statusKey = null;

		recorder.ondataavailable = (event) => {
			if (!session.cancelled && event.data.size > 0) {
				session.chunks.push(event.data);
			}
		};
		recorder.onstop = () => {
			session.track.stop();
			if (activeRecording === session) activeRecording = null;
			recording = false;
			videoProgress = null;
			if (session.cancelled) return;
			const resultMimeType = recorder.mimeType || recordingMimeType;
			const blob = new Blob(session.chunks, { type: resultMimeType });
			clearVideoResult();
			videoBlob = blob;
			videoUrl = URL.createObjectURL(blob);
			videoBytes = blob.size;
			videoResultMimeType = resultMimeType;
			statusKey = 'jellyGif.videoDone';
			errorKey = null;
		};

		const buffer = new Uint8ClampedArray(
			recordingSize.width * recordingSize.height * 4
		);
		const imageData = new ImageData(
			buffer,
			recordingSize.width,
			recordingSize.height
		);
		const delayMs = recordingSettings.delayCentiseconds * 10;
		const startedRecordingAt = performance.now();
		const drawFrame = (frameIndex: number): void => {
			renderFrame(recordingSource, recordingSettings, frameIndex, buffer);
			if (recordingBackground) {
				compositeInPlace(
					{
						width: recordingSize.width,
						height: recordingSize.height,
						data: buffer
					},
					recordingBackground
				);
			}
			scratchContext.putImageData(imageData, 0, 0);
			recordingContext.clearRect(
				0,
				0,
				recordingSize.width,
				recordingSize.height
			);
			if (!recordingBackground) {
				recordingContext.fillStyle = recordingBackgroundColor;
				recordingContext.fillRect(
					0,
					0,
					recordingSize.width,
					recordingSize.height
				);
			}
			recordingContext.drawImage(scratchCanvas, 0, 0);
			session.track.requestFrame?.();
		};

		try {
			recorder.start();
			for (let index = 0; index < recordingSettings.frameCount; index += 1) {
				if (session.cancelled) return;
				drawFrame(index);
				videoProgress = {
					completed: index + 1,
					total: recordingSettings.frameCount
				};
				await waitForRecordingTime(
					startedRecordingAt + (index + 1) * delayMs,
					session
				);
			}
			if (session.cancelled) return;
			drawFrame(0);
			if (!session.cancelled && recorder.state !== 'inactive') recorder.stop();
		} catch {
			cancelRecording();
			errorKey = 'jellyGif.encodeError';
		}
	}

	function sharingWasAborted(error: unknown): boolean {
		return (
			typeof error === 'object' &&
			error !== null &&
			'name' in error &&
			error.name === 'AbortError'
		);
	}

	async function shareGif(): Promise<void> {
		if (!resultBlob) return;
		try {
			await navigator.share({
				files: [new File([resultBlob], downloadName, { type: 'image/gif' })],
				title: translate($locale, 'jellyGif.heading')
			});
		} catch (error) {
			if (!sharingWasAborted(error)) statusKey = 'jellyGif.shareFailed';
		}
	}

	async function shareVideo(): Promise<void> {
		if (!videoBlob || !videoResultMimeType) return;
		try {
			await navigator.share({
				files: [
					new File([videoBlob], videoDownloadName, {
						type: videoResultMimeType
					})
				],
				title: translate($locale, 'jellyGif.heading')
			});
		} catch (error) {
			if (!sharingWasAborted(error)) statusKey = 'jellyGif.shareFailed';
		}
	}

	function statusText(): string {
		if (recording) {
			return translate($locale, 'jellyGif.recording', {
				completed: videoProgress?.completed ?? 0,
				total: videoProgress?.total ?? settings.frameCount
			});
		}
		if (encoding) {
			const completed = progress?.completed ?? 0;
			const total = progress?.total ?? settings.frameCount;
			const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
			return translate($locale, 'jellyGif.generating', { percent });
		}
		if (errorKey) return translate($locale, errorKey);
		if (statusKey === 'jellyGif.done') {
			return translate($locale, statusKey, { size: formatBytes(resultBytes) });
		}
		if (statusKey === 'jellyGif.videoDone') {
			return translate($locale, statusKey, { size: formatBytes(videoBytes) });
		}
		return statusKey ? translate($locale, statusKey) : '';
	}
</script>

<div class="jelly-gif-studio" data-testid="jelly-gif-studio">
	<div class="grid gap-6 lg:grid-cols-2">
		<div class="min-w-0">
			<div
				class="card border-base-300 bg-base-100 border shadow-sm transition-colors"
				class:border-primary={dragging}
				role="group"
				aria-label={translate($locale, 'jellyGif.controls')}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
			>
				<div class="card-body gap-5 p-5 sm:p-6">
					<div>
						<label class="mb-2 block font-medium" for="jelly-gif-file">
							{translate($locale, 'jellyGif.fileLabel')}
						</label>
						<input
							id="jelly-gif-file"
							type="file"
							accept="image/*"
							class="file-input w-full"
							disabled={encoding || recording}
							onchange={handleFileChange}
						/>
						<p class="text-base-content/70 mt-2 text-sm">
							{translate($locale, 'jellyGif.dropHint')}
						</p>
						{#if source}
							<p class="text-base-content/70 mt-2 text-sm break-words">
								{translate($locale, 'jellyGif.sourceInfo', {
									name: sourceName,
									width: source.width,
									height: source.height
								})}
							</p>
						{/if}
					</div>

					<fieldset class="fieldset" disabled={encoding || recording}>
						<legend class="fieldset-legend">
							{translate($locale, 'jellyGif.controls')}
						</legend>

						<label for="jelly-gif-mode"
							>{translate($locale, 'jellyGif.mode')}</label
						>
						<select
							id="jelly-gif-mode"
							class="select w-full"
							value={settings.mode}
							onchange={handleMode}
							disabled={encoding || recording}
						>
							<option value="wave"
								>{translate($locale, 'jellyGif.modeWave')}</option
							>
							<option value="shake"
								>{translate($locale, 'jellyGif.modeShake')}</option
							>
							<option value="squish"
								>{translate($locale, 'jellyGif.modeSquish')}</option
							>
						</select>

						<div class="mt-2 grid gap-4">
							<RangeField
								id="jelly-gif-amplitude"
								label={translate($locale, 'jellyGif.amplitude')}
								value={settings.amplitude}
								min={0}
								max={64}
								unit={translate($locale, 'jellyGif.pixelUnit')}
								disabled={encoding || recording}
								oninput={(value) => handleNumber('amplitude', value)}
							/>
							<RangeField
								id="jelly-gif-wavelength"
								label={translate($locale, 'jellyGif.wavelength')}
								value={settings.wavelength}
								min={16}
								max={1024}
								step={8}
								unit={translate($locale, 'jellyGif.pixelUnit')}
								disabled={encoding || recording || settings.mode === 'shake'}
								oninput={(value) => handleNumber('wavelength', value)}
							/>
							<RangeField
								id="jelly-gif-speed"
								label={translate($locale, 'jellyGif.speed')}
								value={targetHz}
								min={MIN_SPEED_HZ}
								max={MAX_SPEED_HZ}
								step={0.05}
								unit="Hz"
								inputmode="decimal"
								readout={translate($locale, 'jellyGif.speedValue', {
									frames: settings.frameCount,
									seconds: formatTwoDecimals(loopSeconds)
								})}
								disabled={encoding || recording}
								oninput={handleSpeed}
								onchange={handleSpeedCommit}
							/>
							<RangeField
								id="jelly-gif-delay"
								label={translate($locale, 'jellyGif.delay')}
								value={settings.delayCentiseconds}
								min={2}
								max={20}
								readout={translate($locale, 'jellyGif.fps', {
									fps: formatFps(settings.delayCentiseconds)
								})}
								disabled={encoding || recording}
								oninput={handleDelay}
								onchange={handleDelayCommit}
							/>
						</div>

						<label class="mt-2" for="jelly-gif-direction"
							>{translate($locale, 'jellyGif.direction')}</label
						>
						<select
							id="jelly-gif-direction"
							class="select w-full"
							value={settings.direction}
							onchange={handleDirection}
							disabled={encoding || recording}
						>
							<option value="horizontal"
								>{translate($locale, 'jellyGif.directionHorizontal')}</option
							>
							<option value="vertical"
								>{translate($locale, 'jellyGif.directionVertical')}</option
							>
							<option value="both"
								>{translate($locale, 'jellyGif.directionBoth')}</option
							>
						</select>

						<label class="mt-2" for="jelly-gif-background"
							>{translate($locale, 'jellyGif.background')}</label
						>
						<select
							id="jelly-gif-background"
							class="select w-full"
							value={backgroundMode}
							onchange={handleBackgroundMode}
							disabled={encoding || recording}
						>
							<option value="none"
								>{translate($locale, 'jellyGif.backgroundNone')}</option
							>
							<option value="color"
								>{translate($locale, 'jellyGif.backgroundColor')}</option
							>
							<option value="image"
								>{translate($locale, 'jellyGif.backgroundImage')}</option
							>
						</select>

						{#if backgroundMode === 'color'}
							<label class="mt-2" for="jelly-gif-video-background"
								>{translate($locale, 'jellyGif.videoBackground')}</label
							>
							<input
								id="jelly-gif-video-background"
								type="color"
								class="input h-12 w-20 p-1"
								value={backgroundColor}
								disabled={encoding || recording}
								oninput={handleBackgroundColor}
							/>
						{:else if backgroundMode === 'image'}
							<label class="mt-2" for="jelly-gif-background-file"
								>{translate($locale, 'jellyGif.backgroundImage')}</label
							>
							<input
								id="jelly-gif-background-file"
								type="file"
								accept="image/*"
								class="file-input w-full"
								disabled={encoding || recording}
								onchange={handleBackgroundFileChange}
							/>
							{#if backgroundName}
								<p class="text-base-content/70 text-sm break-words">
									{backgroundName}
								</p>
							{/if}
						{/if}
					</fieldset>

					{#if source && size}
						<div class="text-base-content/70 space-y-1 text-sm">
							<p>
								{translate($locale, 'jellyGif.outputSize', {
									width: size.width,
									height: size.height,
									frames: settings.frameCount,
									seconds: loopSeconds
								})}
							</p>
							<p>
								{translate($locale, 'jellyGif.estimatedSize', {
									size: formatBytes(estimatedBytes)
								})}
							</p>
						</div>
					{/if}

					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							class="btn btn-primary"
							data-testid="jelly-gif-generate"
							disabled={!source || encoding || recording}
							onclick={generate}
						>
							{translate($locale, 'jellyGif.generate')}
						</button>
						{#if encoding}
							<button type="button" class="btn" onclick={cancelGeneration}
								>{translate($locale, 'jellyGif.cancel')}</button
							>
						{/if}
					</div>
					{#if encoding && progress}
						<progress
							class="progress w-full"
							max={progress.total}
							value={progress.completed}
						></progress>
					{/if}
					<div
						class:alert={errorKey !== null}
						class:alert-error={errorKey !== null}
					>
						<p role="status" aria-live="polite">{statusText()}</p>
					</div>
				</div>
			</div>
		</div>

		<div class="min-w-0 space-y-6">
			<div class="card bg-base-100 shadow-sm">
				<div class="card-body gap-4 p-5 sm:p-6">
					{#if source && size}
						<div
							class="jelly-preview bg-base-200 rounded-box overflow-hidden"
							role="img"
							aria-label={translate($locale, 'jellyGif.previewLabel', {
								name: sourceName
							})}
						>
							<canvas
								bind:this={canvas}
								aria-hidden="true"
								width={size.width}
								height={size.height}
							></canvas>
						</div>
					{:else}
						<div
							class="bg-base-200 text-base-content/70 rounded-box grid min-h-48 place-items-center p-6 text-center"
						>
							{translate($locale, 'jellyGif.empty')}
						</div>
					{/if}
					<button
						type="button"
						class="btn btn-sm self-start"
						aria-pressed={playing}
						data-testid="jelly-gif-preview-toggle"
						disabled={!source || recording}
						onclick={togglePreview}
					>
						{translate(
							$locale,
							playing ? 'jellyGif.previewPause' : 'jellyGif.previewPlay'
						)}
					</button>
					{#if reducedMotion}
						<p class="text-base-content/70 text-sm">
							{translate($locale, 'jellyGif.reducedMotion')}
						</p>
					{/if}
				</div>
			</div>

			{#if resultUrl && size}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body items-start gap-4 p-5 sm:p-6">
						<img
							data-testid="jelly-gif-result"
							src={resultUrl}
							alt={translate($locale, 'jellyGif.resultAlt')}
							width={size.width}
							height={size.height}
							class="h-auto max-w-full"
						/>
						<p class="text-base-content/70 text-sm">
							{formatBytes(resultBytes)}
						</p>
						<div class="flex flex-wrap gap-2">
							<a
								class="btn btn-primary"
								href={resultUrl}
								download={downloadName}
								data-testid="jelly-gif-download"
								bind:this={downloadLink}
								>{translate($locale, 'jellyGif.download')}</a
							>
							{#if canShareFiles}
								<button
									type="button"
									class="btn"
									data-testid="jelly-gif-share"
									onclick={shareGif}
								>
									{translate($locale, 'jellyGif.share')}
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<div class="card bg-base-100 shadow-sm">
				<div class="card-body items-start gap-4 p-5 sm:p-6">
					<h2 class="card-title text-lg">
						{translate($locale, 'jellyGif.video')}
					</h2>
					{#if videoSupported}
						<p class="text-base-content/70 text-sm">
							{translate($locale, 'jellyGif.videoNote')}
						</p>
						{#if backgroundMode === 'none'}
							<p class="text-base-content/70 text-sm">
								{translate($locale, 'jellyGif.videoWhite')}
							</p>
						{:else}
							<p class="text-base-content/70 text-sm">
								{translate($locale, 'jellyGif.videoUsesBackground')}
							</p>
						{/if}
						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								class="btn"
								data-testid="jelly-gif-record"
								disabled={!source || encoding || recording}
								onclick={recordVideo}
							>
								{translate($locale, 'jellyGif.record')}
							</button>
							{#if recording}
								<button
									type="button"
									class="btn"
									onclick={() => cancelRecording()}
									>{translate($locale, 'jellyGif.cancel')}</button
								>
							{/if}
						</div>
						{#if videoUrl && size}
							<video
								data-testid="jelly-gif-video"
								src={videoUrl}
								controls
								loop
								muted
								playsinline
								autoplay
								width={size.width}
								height={size.height}
								class="h-auto max-w-full"
								aria-label={translate($locale, 'jellyGif.videoAlt')}
							></video>
							<p class="text-base-content/70 text-sm">
								{formatBytes(videoBytes)}
							</p>
							<div class="flex flex-wrap gap-2">
								<a
									data-testid="jelly-gif-video-download"
									class="btn"
									href={videoUrl}
									download={videoDownloadName}
									>{translate($locale, 'jellyGif.videoDownload')}</a
								>
								{#if canShareFiles}
									<button
										type="button"
										class="btn"
										data-testid="jelly-gif-video-share"
										onclick={shareVideo}
									>
										{translate($locale, 'jellyGif.shareVideo')}
									</button>
								{/if}
							</div>
						{/if}
					{:else}
						<p class="text-base-content/70 text-sm">
							{translate($locale, 'jellyGif.videoUnsupported')}
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.jelly-gif-studio {
		content-visibility: auto;
		contain-intrinsic-block-size: auto 64rem;
	}

	.jelly-preview canvas {
		display: block;
		max-width: 100%;
		height: auto;
		margin-inline: auto;
		image-rendering: auto;
	}

	.jelly-preview {
		background-image:
			linear-gradient(45deg, var(--color-base-300) 25%, transparent 25%),
			linear-gradient(-45deg, var(--color-base-300) 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, var(--color-base-300) 75%),
			linear-gradient(-45deg, transparent 75%, var(--color-base-300) 75%);
		background-position:
			0 0,
			0 0.5rem,
			0.5rem -0.5rem,
			-0.5rem 0;
		background-size: 1rem 1rem;
	}

	@media (forced-colors: active) {
		.jelly-preview {
			background-image: none;
			border: 1px solid CanvasText;
		}
	}
</style>
