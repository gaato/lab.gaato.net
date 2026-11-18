<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import VideoWorker from '#lib/media/video.worker.ts?worker';
	import { locale, translate, type MessageKey } from '#lib/i18n.ts';
	import { planEncode, type EncodePlan } from '#lib/media/plan.ts';
	import { trimEndUs as normalizeTrimEndUs } from '#lib/media/timing.ts';
	import type {
		VideoSourceInfo,
		VideoWorkerErrorCode,
		VideoWorkerPhase,
		VideoWorkerResponse
	} from '#lib/media/video-worker.ts';

	let sourceFile = $state.raw<File | null>(null);
	let sourceInfo = $state.raw<VideoSourceInfo | null>(null);
	let targetPreset = $state('20');
	let customTargetMiB = $state(8);
	let trimStart = $state(0);
	let trimEnd = $state(0);
	let keepAudio = $state(true);
	let inspecting = $state(false);
	let compressing = $state(false);
	let dragging = $state(false);
	let browserSupported = $state(false);
	let featureChecked = $state(false);
	let aacEncodeSupported = $state(false);
	let canShareFiles = $state(false);
	let progress = $state<{ phase: VideoWorkerPhase; fraction: number } | null>(
		null
	);
	let resultUrl = $state<string | null>(null);
	let resultBytes = $state(0);
	let exceededTarget = $state(false);
	let statusKey = $state<MessageKey | null>(null);
	let errorKey = $state<MessageKey | null>(null);
	let errorDetail = $state('');
	let resultPlan = $state.raw<EncodePlan | null>(null);

	let worker: Worker | null = null;
	let requestSequence = 0;
	let activeRequestId: number | null = null;
	let resultBlob: Blob | null = null;
	let compressButton = $state<HTMLButtonElement | null>(null);
	let cancelButton = $state<HTMLButtonElement | null>(null);

	const targetMiB = $derived(
		targetPreset === 'custom' ? customTargetMiB : Number(targetPreset)
	);
	const targetBytes = $derived(
		Math.max(1, Math.floor(targetMiB * 1024 * 1024))
	);
	const normalizedEndUs = $derived(
		sourceInfo ? normalizeTrimEndUs(trimEnd, sourceInfo.durationUs) : 0
	);
	const rotated = $derived(
		sourceInfo?.video.rotation === 90 || sourceInfo?.video.rotation === 270
	);
	const trimValid = $derived(
		sourceInfo !== null &&
			Number.isFinite(trimStart) &&
			Number.isFinite(trimEnd) &&
			trimStart >= 0 &&
			normalizedEndUs > trimStart * 1_000_000 &&
			trimEnd <= sourceInfo.durationUs / 1_000_000 + 0.001
	);
	const livePlan = $derived.by(() => {
		if (!sourceInfo || !trimValid) return null;
		return planEncode({
			durationUs: normalizedEndUs - Math.round(trimStart * 1_000_000),
			width: sourceInfo.video.width,
			height: sourceInfo.video.height,
			fps: sourceInfo.video.fps,
			videoSourceBitrate: sourceInfo.video.bitrate,
			rotation: sourceInfo.video.rotation,
			targetBytes,
			audioPresent: Boolean(sourceInfo.audio),
			audioSourceBitrate: sourceInfo.audio?.bitrate,
			audioCodec: sourceInfo.audio?.codec,
			keepAudio,
			aacEncodeSupported
		});
	});
	const downloadName = $derived(makeDownloadName(sourceFile?.name ?? ''));
	const alreadyFits = $derived(
		Boolean(sourceFile && sourceFile.size <= targetBytes)
	);

	onMount(() => {
		worker = new VideoWorker();
		worker.onmessage = handleWorkerMessage;
		worker.onerror = () => {
			inspecting = false;
			endCompression();
			statusKey = null;
			errorKey = 'discordVideo.invalidFile';
		};

		const handlePaste = (event: ClipboardEvent): void => {
			const file = Array.from(event.clipboardData?.files ?? []).find(
				isVideoFile
			);
			if (file) inspectFile(file);
		};
		window.addEventListener('paste', handlePaste);
		void detectFeatures();

		return () => window.removeEventListener('paste', handlePaste);
	});

	onDestroy(() => {
		worker?.terminate();
		if (resultUrl) URL.revokeObjectURL(resultUrl);
	});

	async function detectFeatures(): Promise<void> {
		try {
			if (
				typeof VideoEncoder === 'undefined' ||
				typeof VideoDecoder === 'undefined' ||
				typeof OffscreenCanvas === 'undefined'
			) {
				browserSupported = false;
				return;
			}
			const h264 = await VideoEncoder.isConfigSupported({
				codec: 'avc1.640028',
				width: 320,
				height: 240,
				bitrate: 500_000,
				framerate: 30,
				avc: { format: 'avc' }
			} as VideoEncoderConfig);
			browserSupported = Boolean(h264.supported);
			if (typeof AudioEncoder !== 'undefined') {
				try {
					const aac = await AudioEncoder.isConfigSupported({
						codec: 'mp4a.40.2',
						sampleRate: 48000,
						numberOfChannels: 2,
						bitrate: 128_000,
						aac: { format: 'aac' }
					} as AudioEncoderConfig);
					aacEncodeSupported = Boolean(aac.supported);
				} catch {
					aacEncodeSupported = false;
				}
			}
			try {
				canShareFiles =
					typeof navigator.canShare === 'function' &&
					navigator.canShare({
						files: [
							new File([Uint8Array.of(0)], 'probe.mp4', { type: 'video/mp4' })
						]
					});
			} catch {
				canShareFiles = false;
			}
		} catch {
			browserSupported = false;
		} finally {
			featureChecked = true;
		}
	}

	function isVideoFile(file: File): boolean {
		return (
			file.type.startsWith('video/') || /\.(?:mp4|mov|m4v)$/iu.test(file.name)
		);
	}

	function handleFileInput(event: Event): void {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (file) inspectFile(file);
	}

	function handleDrop(event: DragEvent): void {
		event.preventDefault();
		dragging = false;
		const file = Array.from(event.dataTransfer?.files ?? []).find(isVideoFile);
		if (file) inspectFile(file);
	}

	function inspectFile(file: File): void {
		clearResult();
		sourceFile = file;
		sourceInfo = null;
		inspecting = true;
		errorKey = null;
		statusKey = 'discordVideo.inspecting';
		const requestId = ++requestSequence;
		activeRequestId = requestId;
		worker?.postMessage({ type: 'inspect', requestId, file });
	}

	function handleWorkerMessage(event: MessageEvent<VideoWorkerResponse>): void {
		const message = event.data;
		if (message.requestId !== activeRequestId) return;
		if (message.type === 'progress') {
			progress = { phase: message.phase, fraction: message.fraction };
			return;
		}
		if (message.type === 'info') {
			sourceInfo = message.info;
			trimStart = 0;
			trimEnd = message.info.durationUs / 1_000_000;
			inspecting = false;
			progress = null;
			statusKey = 'discordVideo.inspected';
			return;
		}
		if (message.type === 'plan') {
			resultPlan = message.plan;
			return;
		}
		if (message.type === 'result') {
			endCompression();
			progress = null;
			resultPlan = message.plan;
			exceededTarget = message.exceededTarget;
			resultBytes = message.mp4.byteLength;
			resultBlob = new Blob([message.mp4.slice().buffer], {
				type: 'video/mp4'
			});
			resultUrl = URL.createObjectURL(resultBlob);
			statusKey = message.exceededTarget
				? 'discordVideo.exceeded'
				: 'discordVideo.done';
			return;
		}
		if (message.type === 'error') {
			inspecting = false;
			endCompression();
			progress = null;
			errorKey = errorMessageKey(message.error.code);
			errorDetail = message.error.detail ?? '';
			statusKey =
				message.error.code === 'cancelled' ? 'discordVideo.cancelled' : null;
		}
	}

	// The cancel button only exists while compressing. If it has focus when the
	// job ends, removing it would drop focus to the document body, so hand focus
	// to the compress button, which stays in place.
	function endCompression(): void {
		const cancelHadFocus =
			cancelButton !== null && document.activeElement === cancelButton;
		compressing = false;
		if (cancelHadFocus) void tick().then(() => compressButton?.focus());
	}

	function errorMessageKey(code: VideoWorkerErrorCode): MessageKey {
		switch (code) {
			case 'container_unsupported':
				return 'discordVideo.containerUnsupported';
			case 'fragmented_unsupported':
				return 'discordVideo.fragmentedUnsupported';
			case 'codec_unsupported':
				return 'discordVideo.codecUnsupported';
			case 'decode_unsupported':
				return 'discordVideo.decodeUnsupported';
			case 'encode_unsupported':
				return 'discordVideo.encodeUnsupported';
			case 'cancelled':
				return 'discordVideo.cancelled';
			default:
				return 'discordVideo.invalidFile';
		}
	}

	function startCompression(): void {
		if (
			!sourceFile ||
			!sourceInfo ||
			!trimValid ||
			!browserSupported ||
			compressing
		)
			return;
		clearResult();
		errorKey = null;
		statusKey = null;
		compressing = true;
		const requestId = ++requestSequence;
		activeRequestId = requestId;
		worker?.postMessage({
			type: 'encode',
			requestId,
			file: sourceFile,
			targetBytes,
			trimStartUs: Math.round(trimStart * 1_000_000),
			trimEndUs: normalizedEndUs,
			keepAudio,
			aacEncodeSupported
		});
	}

	function cancel(): void {
		if (activeRequestId !== null)
			worker?.postMessage({ type: 'cancel', requestId: activeRequestId });
	}

	function clearResult(): void {
		if (resultUrl) URL.revokeObjectURL(resultUrl);
		resultUrl = null;
		resultBlob = null;
		resultBytes = 0;
		exceededTarget = false;
		resultPlan = null;
	}

	async function share(): Promise<void> {
		if (!resultBlob) return;
		try {
			await navigator.share({
				files: [new File([resultBlob], downloadName, { type: 'video/mp4' })],
				title: translate($locale, 'discordVideo.heading')
			});
		} catch (error) {
			if (!(error instanceof DOMException && error.name === 'AbortError'))
				statusKey = 'discordVideo.shareFailed';
		}
	}

	function makeDownloadName(name: string): string {
		const base = name.replace(/\.[^.]*$/u, '').trim();
		return `${base || 'video'}-discord.mp4`;
	}

	function formatBytes(bytes: number): string {
		const isMiB = bytes >= 1024 * 1024;
		return `${formatDecimal(bytes / (isMiB ? 1024 * 1024 : 1024))} ${isMiB ? 'MiB' : 'KiB'}`;
	}

	function formatDecimal(value: number, digits = 2): string {
		return new Intl.NumberFormat($locale, {
			maximumFractionDigits: digits
		}).format(value);
	}

	function phaseLabel(phase: VideoWorkerPhase): string {
		const keys: Record<VideoWorkerPhase, MessageKey> = {
			inspect: 'discordVideo.phaseInspect',
			audio: 'discordVideo.phaseAudio',
			decode: 'discordVideo.phaseDecode',
			encode: 'discordVideo.phaseEncode',
			mux: 'discordVideo.phaseMux'
		};
		return translate($locale, keys[phase]);
	}
</script>

<div class="space-y-6" data-testid="discord-video-compressor">
	{#if featureChecked && !browserSupported}
		<div class="alert alert-warning" role="status">
			<span>{translate($locale, 'discordVideo.unsupported')}</span>
		</div>
	{/if}

	<div
		class="border-base-300 bg-base-100 rounded-box border-2 border-dashed p-5 transition-colors"
		class:border-primary={dragging}
		role="group"
		aria-labelledby="discord-video-file-label"
		ondragenter={(event) => {
			event.preventDefault();
			dragging = true;
		}}
		ondragover={(event) => event.preventDefault()}
		ondragleave={(event) => {
			if (event.currentTarget === event.target) dragging = false;
		}}
		ondrop={handleDrop}
	>
		<label
			id="discord-video-file-label"
			class="label mb-2 font-semibold"
			for="discord-video-file"
		>
			{translate($locale, 'discordVideo.fileLabel')}
		</label>
		<input
			id="discord-video-file"
			class="file-input file-input-bordered w-full"
			type="file"
			name="video"
			accept="video/mp4,video/quicktime,.mp4,.mov,.m4v"
			onchange={handleFileInput}
		/>
		<p class="text-base-content/65 mt-2 text-sm" id="discord-video-file-hint">
			{translate($locale, 'discordVideo.dropHint')}
		</p>
	</div>

	{#if inspecting}
		<p class="text-base-content/70">
			{translate($locale, 'discordVideo.inspecting')}
		</p>
	{/if}

	{#if sourceFile && sourceInfo}
		<section
			class="card bg-base-100 shadow-sm"
			aria-labelledby="discord-video-source-heading"
		>
			<div class="card-body gap-2">
				<h2 id="discord-video-source-heading" class="card-title text-lg">
					{translate($locale, 'discordVideo.fileLabel')}
				</h2>
				<p data-testid="discord-video-source-info">
					{translate($locale, 'discordVideo.sourceInfo', {
						name: sourceFile.name,
						size: formatBytes(sourceFile.size),
						duration: formatDecimal(sourceInfo.durationUs / 1_000_000, 3),
						width: rotated ? sourceInfo.video.height : sourceInfo.video.width,
						height: rotated ? sourceInfo.video.width : sourceInfo.video.height,
						codec: sourceInfo.video.codec
					})}
				</p>
				<p class="text-base-content/70 text-sm">
					{sourceInfo.audio
						? translate($locale, 'discordVideo.audioInfo', {
								codec: sourceInfo.audio.codec,
								channels: sourceInfo.audio.channelCount,
								rate: sourceInfo.audio.sampleRate
							})
						: translate($locale, 'discordVideo.noAudio')}
				</p>
			</div>
		</section>

		<form
			class="card bg-base-100 shadow-sm"
			aria-labelledby="discord-video-settings-heading"
			novalidate
			onsubmit={(event) => {
				event.preventDefault();
				startCompression();
			}}
		>
			<div class="card-body gap-5">
				<h2 id="discord-video-settings-heading" class="card-title text-lg">
					{translate($locale, 'discordVideo.settings')}
				</h2>

				<div class="form-control">
					<label class="label" for="discord-video-target">
						<span class="label-text font-medium">
							{translate($locale, 'discordVideo.target')}
						</span>
					</label>
					<select
						id="discord-video-target"
						name="target"
						class="select select-bordered w-full"
						bind:value={targetPreset}
					>
						<option value="20">
							{translate($locale, 'discordVideo.target20')}
						</option>
						<option value="50">
							{translate($locale, 'discordVideo.target50')}
						</option>
						<option value="100">
							{translate($locale, 'discordVideo.target100')}
						</option>
						<option value="custom">
							{translate($locale, 'discordVideo.targetCustom')}
						</option>
					</select>
				</div>

				{#if targetPreset === 'custom'}
					<div class="form-control">
						<label class="label" for="discord-video-custom-target">
							<span class="label-text font-medium">
								{translate($locale, 'discordVideo.customTarget')}
							</span>
						</label>
						<p
							id="discord-video-custom-hint"
							class="text-base-content/65 mb-2 text-sm"
						>
							{translate($locale, 'discordVideo.customTargetHint')}
						</p>
						<input
							id="discord-video-custom-target"
							class="input input-bordered w-full"
							type="number"
							name="customTarget"
							min="0.1"
							step="0.1"
							aria-describedby="discord-video-custom-hint"
							bind:value={customTargetMiB}
						/>
					</div>
				{/if}

				<fieldset class="space-y-3">
					<legend class="font-medium">
						{translate($locale, 'discordVideo.trim')}
					</legend>
					<div class="grid gap-3 sm:grid-cols-2">
						<div class="form-control">
							<label class="label" for="discord-video-trim-start">
								{translate($locale, 'discordVideo.trimStart')}
							</label>
							<input
								id="discord-video-trim-start"
								class="input input-bordered w-full"
								type="number"
								name="trimStart"
								min="0"
								step="any"
								bind:value={trimStart}
								aria-invalid={!trimValid}
								aria-describedby={!trimValid
									? 'discord-video-trim-error'
									: undefined}
							/>
						</div>
						<div class="form-control">
							<label class="label" for="discord-video-trim-end">
								{translate($locale, 'discordVideo.trimEnd')}
							</label>
							<input
								id="discord-video-trim-end"
								class="input input-bordered w-full"
								type="number"
								name="trimEnd"
								min="0"
								max={sourceInfo.durationUs / 1_000_000 + 0.001}
								step="any"
								bind:value={trimEnd}
								aria-invalid={!trimValid}
								aria-describedby={!trimValid
									? 'discord-video-trim-error'
									: undefined}
							/>
						</div>
					</div>
					{#if !trimValid}
						<p id="discord-video-trim-error" class="text-error text-sm">
							{translate($locale, 'discordVideo.trimError')}
						</p>
					{/if}
				</fieldset>

				{#if sourceInfo.audio}
					<label
						class="label cursor-pointer justify-start gap-3"
						for="discord-video-keep-audio"
					>
						<input
							id="discord-video-keep-audio"
							class="toggle toggle-primary"
							type="checkbox"
							name="keepAudio"
							bind:checked={keepAudio}
						/>
						<span class="label-text">
							{translate($locale, 'discordVideo.keepAudio')}
						</span>
					</label>
				{/if}

				{#if alreadyFits}
					<div
						class="alert alert-info"
						data-testid="discord-video-already-fits"
					>
						<span>{translate($locale, 'discordVideo.alreadyFits')}</span>
					</div>
				{/if}

				{#if livePlan}
					<section
						class="bg-base-200 rounded-box p-4"
						aria-labelledby="discord-video-plan-heading"
					>
						<h3 id="discord-video-plan-heading" class="font-semibold">
							{translate($locale, 'discordVideo.plan')}
						</h3>
						<p class="mt-1">
							{translate($locale, 'discordVideo.planVideo', {
								width: rotated ? livePlan.height : livePlan.width,
								height: rotated ? livePlan.width : livePlan.height,
								fps: formatDecimal(livePlan.fps, 1),
								bitrate: Math.round(livePlan.videoBitrate / 1000)
							})}
						</p>
						<p class="text-base-content/70 text-sm">
							{livePlan.audioMode === 'none'
								? translate($locale, 'discordVideo.planAudioNone')
								: livePlan.audioMode === 'copy'
									? translate($locale, 'discordVideo.planAudioCopy', {
											bitrate: Math.round(livePlan.audioBitrate / 1000)
										})
									: translate($locale, 'discordVideo.planAudioEncode', {
											codec:
												livePlan.audioMode === 'encode-aac' ? 'AAC' : 'Opus',
											bitrate: Math.round(livePlan.audioBitrate / 1000)
										})}
						</p>
						{#if livePlan.tooSmall}
							<p
								class="text-warning mt-2 text-sm"
								data-testid="discord-video-too-small"
							>
								{translate($locale, 'discordVideo.tooSmall', {
									size: formatBytes(livePlan.minimumFeasibleBytes)
								})}
							</p>
						{/if}
					</section>
				{/if}

				<div class="card-actions items-center">
					<button
						class="btn btn-primary"
						type="submit"
						data-testid="discord-video-compress"
						bind:this={compressButton}
						disabled={compressing || !trimValid || !browserSupported}
					>
						{translate($locale, 'discordVideo.compress')}
					</button>
					{#if compressing}
						<button
							class="btn btn-ghost"
							type="button"
							data-testid="discord-video-cancel"
							bind:this={cancelButton}
							onclick={cancel}
						>
							{translate($locale, 'discordVideo.cancel')}
						</button>
					{/if}
				</div>

				{#if progress && compressing}
					<div>
						<progress
							class="progress progress-primary w-full"
							value={progress.fraction}
							max="1"
						></progress>
						<p class="text-base-content/70 mt-1 text-sm">
							{translate($locale, 'discordVideo.progress', {
								phase: phaseLabel(progress.phase),
								percent: Math.round(progress.fraction * 100)
							})}
						</p>
					</div>
				{/if}
			</div>
		</form>
	{/if}

	{#if errorKey}
		<div class="alert alert-error" role="alert">
			<span>{translate($locale, errorKey, { codec: errorDetail || '?' })}</span>
		</div>
	{/if}

	<div
		class="sr-only"
		role="status"
		aria-live="polite"
		aria-atomic="true"
		data-testid="discord-video-status"
	>
		{statusKey
			? translate($locale, statusKey, {
					name: sourceFile?.name ?? '',
					size: formatBytes(resultBytes),
					target: formatBytes(targetBytes)
				})
			: ''}
	</div>

	{#if resultUrl}
		<section
			class="card bg-base-100 shadow-sm"
			aria-labelledby="discord-video-result-heading"
		>
			<div class="card-body">
				<h2 id="discord-video-result-heading" class="card-title text-lg">
					{translate($locale, 'discordVideo.preview')}
				</h2>
				<p
					class={exceededTarget ? 'text-warning' : 'text-success'}
					data-testid="discord-video-result-size"
				>
					{translate(
						$locale,
						exceededTarget ? 'discordVideo.exceeded' : 'discordVideo.done',
						{
							size: formatBytes(resultBytes),
							target: formatBytes(targetBytes)
						}
					)}
				</p>
				<!-- The preview is user-provided media transformed locally, so this tool has no captions file to attach. -->
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					class="bg-neutral mt-2 max-h-[70vh] w-full rounded-lg"
					controls
					playsinline
					src={resultUrl}
					data-testid="discord-video-result"
					data-result-bytes={resultBytes}
				>
					{translate($locale, 'discordVideo.preview')}
				</video>
				<div class="card-actions mt-3">
					<a
						class="btn btn-primary"
						href={resultUrl}
						download={downloadName}
						data-testid="discord-video-download"
					>
						{translate($locale, 'discordVideo.download')}
					</a>
					{#if canShareFiles}
						<button
							class="btn btn-secondary"
							type="button"
							onclick={share}
							data-testid="discord-video-share"
						>
							{translate($locale, 'discordVideo.share')}
						</button>
					{/if}
				</div>
			</div>
		</section>
	{/if}
</div>
