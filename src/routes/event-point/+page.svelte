<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import {
		MAX_JUMPS,
		MAX_MAX_RUNS,
		calculateReward,
		parseBonusPercent,
		parsePointInput,
		solveEventPoint,
		type EventPointPlan,
		type SolveInput,
		type SolveResult
	} from '$lib/event-point';
	import {
		formatInteger,
		isLocale,
		locale,
		translate,
		type Locale,
		type MessageKey
	} from '$lib/i18n';

	type FieldName = 'current' | 'target' | 'bonus' | 'maxJumps' | 'maxRuns';
	type FieldErrors = Partial<Record<FieldName, MessageKey>>;
	type JumpGroup = { jumps: number; count: number; reward: bigint };

	let current = '';
	let target = '';
	let bonus = '0';
	let passport = false;
	let maxJumps = '50';
	let maxRuns = '8';
	let errors: FieldErrors = {};
	let showErrorSummary = false;
	let queryNotice = false;
	let result: SolveResult | null = null;
	let calculatedInput: SolveInput | null = null;
	let copyStatus: MessageKey | null = null;
	let shareUrl = '';
	let navigatedUrl = '';
	let lastCalculationQueryKey: string | null = null;
	let searchLimitsOpen = false;
	let formElement: HTMLFormElement;

	const calculationParameterNames = [
		'current',
		'target',
		'bonus',
		'passport',
		'maxJumps',
		'maxRuns'
	] as const;

	function normalizeWholeNumber(raw: string): string {
		return raw.normalize('NFKC').replace(/[,\s]/gu, '');
	}

	function parseBoundedInteger(
		raw: string,
		minimum: number,
		maximum: number
	): number | null {
		const normalized = normalizeWholeNumber(raw);
		if (!/^\d+$/u.test(normalized)) return null;
		const value = Number(normalized);
		return Number.isSafeInteger(value) && value >= minimum && value <= maximum
			? value
			: null;
	}

	function rawFieldValue(field: FieldName): string {
		switch (field) {
			case 'current':
				return current;
			case 'target':
				return target;
			case 'bonus':
				return bonus;
			case 'maxJumps':
				return maxJumps;
			case 'maxRuns':
				return maxRuns;
		}
	}

	function validateField(field: FieldName): MessageKey | null {
		const raw = rawFieldValue(field);
		if (raw.trim().length === 0) return 'event.errorRequired';

		if (field === 'current' || field === 'target') {
			return parsePointInput(raw).ok ? null : 'event.errorPoint';
		}
		if (field === 'bonus') {
			return parseBonusPercent(raw).ok ? null : 'event.errorBonus';
		}
		if (field === 'maxJumps') {
			return parseBoundedInteger(raw, 0, MAX_JUMPS) === null
				? 'event.errorMaxJumps'
				: null;
		}
		return parseBoundedInteger(raw, 1, MAX_MAX_RUNS) === null
			? 'event.errorMaxRuns'
			: null;
	}

	function validateAndSet(field: FieldName): void {
		const error = validateField(field);
		if (error) {
			errors = { ...errors, [field]: error };
			return;
		}
		clearError(field);
	}

	function clearError(field: FieldName): void {
		if (!(field in errors)) return;
		const next = { ...errors };
		delete next[field];
		errors = next;
		showErrorSummary = showErrorSummary && Object.keys(next).length > 0;
	}

	function invalidateCalculation(): void {
		result = null;
		calculatedInput = null;
		copyStatus = null;
		queryNotice = false;
	}

	function handleFieldInput(field: FieldName, event: Event): void {
		const value = (event.currentTarget as HTMLInputElement).value;
		switch (field) {
			case 'current':
				current = value;
				break;
			case 'target':
				target = value;
				break;
			case 'bonus':
				bonus = value;
				break;
			case 'maxJumps':
				maxJumps = value;
				break;
			case 'maxRuns':
				maxRuns = value;
				break;
		}
		invalidateCalculation();
		if (errors[field]) validateAndSet(field);
	}

	function validateAll(): FieldErrors {
		const next: FieldErrors = {};
		for (const field of [
			'current',
			'target',
			'bonus',
			'maxJumps',
			'maxRuns'
		] as const) {
			const error = validateField(field);
			if (error) next[field] = error;
		}
		errors = next;
		showErrorSummary = Object.keys(next).length > 0;
		return next;
	}

	function focusFirstInvalid(nextErrors: FieldErrors): void {
		const firstField = (
			['current', 'target', 'bonus', 'maxJumps', 'maxRuns'] as const
		).find((field) => nextErrors[field]);
		if (!firstField) return;
		if (firstField === 'maxJumps' || firstField === 'maxRuns') {
			searchLimitsOpen = true;
			const disclosure =
				formElement.querySelector<HTMLDetailsElement>('details');
			if (disclosure) disclosure.open = true;
		}
		const focusInput = (): void => {
			formElement
				.querySelector<HTMLInputElement>(`[name="${firstField}"]`)
				?.focus();
		};
		focusInput();
		setTimeout(focusInput, 0);
		requestAnimationFrame(() => requestAnimationFrame(focusInput));
	}

	function canonicalBonus(bonusPermil: number): string {
		return bonusPermil % 10 === 0
			? String(bonusPermil / 10)
			: (bonusPermil / 10).toFixed(1);
	}

	function calculationQueryKey(parameters: URLSearchParams): string {
		return calculationParameterNames
			.map((name) =>
				parameters.has(name)
					? `${name}=${parameters.getAll(name).join('\u0001')}`
					: `${name}=\u0000`
			)
			.join('\u0002');
	}

	function handleSubmit(event: SubmitEvent): void {
		event.preventDefault();
		const nextErrors = validateAll();
		if (Object.keys(nextErrors).length > 0) {
			focusFirstInvalid(nextErrors);
			return;
		}

		const parsedCurrent = parsePointInput(current);
		const parsedTarget = parsePointInput(target);
		const parsedBonus = parseBonusPercent(bonus);
		const parsedMaxJumps = parseBoundedInteger(maxJumps, 0, MAX_JUMPS);
		const parsedMaxRuns = parseBoundedInteger(maxRuns, 1, MAX_MAX_RUNS);
		if (
			!parsedCurrent.ok ||
			!parsedTarget.ok ||
			!parsedBonus.ok ||
			parsedMaxJumps === null ||
			parsedMaxRuns === null
		) {
			return;
		}

		const parameters = new URLSearchParams({
			current: parsedCurrent.value.toString(),
			target: parsedTarget.value.toString(),
			bonus: canonicalBonus(parsedBonus.value),
			maxJumps: String(parsedMaxJumps),
			maxRuns: String(parsedMaxRuns),
			lang: $locale
		});
		if (passport) parameters.set('passport', '1');
		const nextPath = `/event-point/?${parameters.toString()}`;
		const nextUrl = new URL(nextPath, window.location.origin);
		lastCalculationQueryKey = calculationQueryKey(parameters);
		navigatedUrl = nextUrl.toString();
		solveFromParameters(parameters);
		void goto(nextPath, { noScroll: true });
	}

	function loadExample(): void {
		current = '1,144,899';
		target = '1,145,141';
		bonus = '20';
		passport = true;
		maxJumps = '50';
		maxRuns = '8';
		errors = {};
		showErrorSummary = false;
		invalidateCalculation();
	}

	function solveFromParameters(parameters: URLSearchParams): void {
		current = parameters.get('current') ?? '';
		target = parameters.get('target') ?? '';
		bonus = parameters.get('bonus') ?? '0';
		const passportValues = parameters.getAll('passport');
		const passportParameter = passportValues[0] ?? null;
		const passportIsValid =
			passportValues.length <= 1 &&
			(passportParameter === null ||
				passportParameter === '0' ||
				passportParameter === '1');
		passport = passportParameter === '1';
		maxJumps = parameters.get('maxJumps') ?? '50';
		maxRuns = parameters.get('maxRuns') ?? '8';
		errors = {};
		showErrorSummary = false;
		queryNotice = false;
		copyStatus = null;

		const hasCalculationParameters = calculationParameterNames.some((name) =>
			parameters.has(name)
		);
		const hasDuplicateParameters = calculationParameterNames.some(
			(name) => parameters.getAll(name).length > 1
		);
		if (!hasCalculationParameters) {
			result = null;
			calculatedInput = null;
			return;
		}

		const nextErrors = validateAll();
		if (nextErrors.maxJumps || nextErrors.maxRuns) searchLimitsOpen = true;
		if (
			Object.keys(nextErrors).length > 0 ||
			!passportIsValid ||
			hasDuplicateParameters
		) {
			queryNotice = true;
			showErrorSummary = false;
			result = null;
			calculatedInput = null;
			return;
		}

		const parsedCurrent = parsePointInput(current);
		const parsedTarget = parsePointInput(target);
		const parsedBonus = parseBonusPercent(bonus);
		const parsedMaxJumps = parseBoundedInteger(maxJumps, 0, MAX_JUMPS);
		const parsedMaxRuns = parseBoundedInteger(maxRuns, 1, MAX_MAX_RUNS);
		if (
			!parsedCurrent.ok ||
			!parsedTarget.ok ||
			!parsedBonus.ok ||
			parsedMaxJumps === null ||
			parsedMaxRuns === null
		) {
			return;
		}

		calculatedInput = {
			current: parsedCurrent.value,
			target: parsedTarget.value,
			bonusPermil: parsedBonus.value,
			hasPassport: passport,
			maxJumps: parsedMaxJumps,
			maxRuns: parsedMaxRuns
		};
		result = solveEventPoint(calculatedInput);
	}

	function groupPlan(plan: EventPointPlan): JumpGroup[] {
		if (!calculatedInput) return [];
		const groups: JumpGroup[] = [];
		for (const jumps of plan.jumps) {
			const previous = groups.at(-1);
			if (previous?.jumps === jumps) {
				previous.count += 1;
				continue;
			}
			groups.push({
				jumps,
				count: 1,
				reward: calculateReward({
					jumps,
					bonusPermil: calculatedInput.bonusPermil,
					hasPassport: calculatedInput.hasPassport
				})
			});
		}
		return groups;
	}

	function resultErrorMessage(
		currentResult: Exclude<SolveResult, { ok: true }>
	): MessageKey {
		switch (currentResult.error.code) {
			case 'target_below_current':
				return 'event.targetBelow';
			case 'unreachable':
				return 'event.unreachable';
			case 'out_of_range':
				return 'event.outOfRange';
			case 'invalid_type':
				return 'event.invalidInput';
			case 'search_limit_exceeded':
				return 'event.searchLimitExceeded';
		}
	}

	function localizedShareUrl(url: URL, activeLocale: Locale): string {
		const next = new URL(url);
		next.searchParams.set('lang', activeLocale);
		return next.toString();
	}

	async function copyCurrentUrl(): Promise<void> {
		try {
			await navigator.clipboard.writeText(
				localizedShareUrl(new URL(window.location.href), $locale)
			);
			copyStatus = 'event.copied';
		} catch {
			copyStatus = 'event.copyFailed';
		}
	}

	afterNavigate(({ to }) => {
		if (!to) return;
		navigatedUrl = to.url.toString();
		const nextQueryKey = calculationQueryKey(to.url.searchParams);
		if (nextQueryKey === lastCalculationQueryKey) return;
		lastCalculationQueryKey = nextQueryKey;
		solveFromParameters(to.url.searchParams);
	});

	$: {
		if (!navigatedUrl) {
			shareUrl = '';
		} else {
			const url = new URL(navigatedUrl);
			const queryLocale = url.searchParams.get('lang');
			shareUrl = localizedShareUrl(
				url,
				isLocale(queryLocale) ? queryLocale : $locale
			);
		}
	}
</script>

<svelte:head>
	<title>{translate($locale, 'event.title')}</title>
	<meta name="description" content={translate($locale, 'event.description')} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="gaato lab" />
	<meta property="og:title" content={translate($locale, 'event.title')} />
	<meta
		property="og:description"
		content={translate($locale, 'event.description')}
	/>
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
	<div class="breadcrumbs mb-2 text-sm">
		<ul>
			<li><a href="/?lang={$locale}">{translate($locale, 'site.home')}</a></li>
			<li>{translate($locale, 'event.heading')}</li>
		</ul>
	</div>

	<header class="flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-bold">{translate($locale, 'event.heading')}</h1>
		<span class="badge badge-outline"
			>{translate($locale, 'event.zeroBoost')}</span
		>
	</header>
	<p class="text-base-content/70 mt-2 text-sm">
		{translate($locale, 'event.summary')}
	</p>

	<div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
		<form
			bind:this={formElement}
			class="card bg-base-100 shadow-sm"
			action="/event-point/"
			method="GET"
			novalidate
			onsubmit={handleSubmit}
		>
			<div class="card-body gap-0 p-5 sm:p-6">
				<input type="hidden" name="lang" value={$locale} />

				<fieldset class="fieldset gap-0 p-0">
					<legend class="fieldset-legend mb-4 p-0 text-lg font-bold"
						>{translate($locale, 'event.formLegend')}</legend
					>

					{#if showErrorSummary}
						<div class="alert alert-error mb-5" role="alert" tabindex="-1">
							<span class="font-semibold"
								>{translate($locale, 'event.formErrorSummary')}</span
							>
						</div>
					{/if}

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="fieldset p-0">
							<label class="label font-semibold" for="current"
								>{translate($locale, 'event.currentLabel')}</label
							>
							<input
								id="current"
								class="input numeric w-full"
								name="current"
								type="text"
								inputmode="numeric"
								enterkeyhint="next"
								autocomplete="off"
								required
								bind:value={current}
								aria-invalid={errors.current ? 'true' : undefined}
								aria-describedby={errors.current ? 'current-error' : undefined}
								onblur={() => validateAndSet('current')}
								oninput={(event) => handleFieldInput('current', event)}
							/>
							{#if errors.current}<p
									id="current-error"
									class="text-error mt-1 text-sm"
								>
									{translate($locale, errors.current)}
								</p>{/if}
						</div>

						<div class="fieldset p-0">
							<label class="label font-semibold" for="target"
								>{translate($locale, 'event.targetLabel')}</label
							>
							<input
								id="target"
								class="input numeric w-full"
								name="target"
								type="text"
								inputmode="numeric"
								enterkeyhint="next"
								autocomplete="off"
								required
								bind:value={target}
								aria-invalid={errors.target ? 'true' : undefined}
								aria-describedby={errors.target ? 'target-error' : undefined}
								onblur={() => validateAndSet('target')}
								oninput={(event) => handleFieldInput('target', event)}
							/>
							{#if errors.target}<p
									id="target-error"
									class="text-error mt-1 text-sm"
								>
									{translate($locale, errors.target)}
								</p>{/if}
						</div>
					</div>

					<div class="fieldset mt-4 p-0">
						<label class="label font-semibold" for="bonus"
							>{translate($locale, 'event.bonusLabel')}</label
						>
						<label
							class="input numeric flex w-full items-center gap-2"
							for="bonus"
						>
							<input
								id="bonus"
								class="min-w-0 grow"
								name="bonus"
								type="text"
								inputmode="decimal"
								enterkeyhint="next"
								autocomplete="off"
								required
								bind:value={bonus}
								aria-invalid={errors.bonus ? 'true' : undefined}
								aria-describedby={`bonus-hint${errors.bonus ? ' bonus-error' : ''}`}
								onblur={() => validateAndSet('bonus')}
								oninput={(event) => handleFieldInput('bonus', event)}
							/>
							<span class="text-base-content/60 font-bold"
								>{translate($locale, 'event.bonusUnit')}</span
							>
						</label>
						<p id="bonus-hint" class="text-base-content/60 mt-1 text-sm">
							{translate($locale, 'event.bonusHint')}
						</p>
						{#if errors.bonus}<p
								id="bonus-error"
								class="text-error mt-1 text-sm"
							>
								{translate($locale, errors.bonus)}
							</p>{/if}
					</div>

					<label
						class="mt-5 flex cursor-pointer items-center justify-between gap-4"
						for="passport"
					>
						<span>
							<strong class="block font-semibold"
								>{translate($locale, 'event.passportLabel')}</strong
							>
							<span
								id="passport-hint"
								class="text-base-content/60 mt-1 block text-sm"
								>{translate($locale, 'event.passportHint')}</span
							>
						</span>
						<input
							id="passport"
							class="toggle toggle-primary shrink-0"
							name="passport"
							type="checkbox"
							value="1"
							bind:checked={passport}
							aria-describedby="passport-hint"
							onchange={invalidateCalculation}
						/>
					</label>
				</fieldset>

				<details
					class="collapse-arrow bg-base-200 collapse mt-5"
					bind:open={searchLimitsOpen}
				>
					<summary class="collapse-title font-semibold"
						>{translate($locale, 'event.limitLegend')}</summary
					>
					<div class="collapse-content grid gap-4 sm:grid-cols-2">
						<div class="fieldset p-0">
							<label class="label font-semibold" for="maxJumps"
								>{translate($locale, 'event.maxJumpsLabel')}</label
							>
							<input
								id="maxJumps"
								class="input numeric w-full"
								name="maxJumps"
								type="text"
								inputmode="numeric"
								enterkeyhint="next"
								required
								bind:value={maxJumps}
								aria-invalid={errors.maxJumps ? 'true' : undefined}
								aria-describedby={`max-jumps-hint${errors.maxJumps ? ' max-jumps-error' : ''}`}
								onblur={() => validateAndSet('maxJumps')}
								oninput={(event) => handleFieldInput('maxJumps', event)}
							/>
							<p id="max-jumps-hint" class="text-base-content/60 mt-1 text-sm">
								{translate($locale, 'event.maxJumpsHint')}
							</p>
							{#if errors.maxJumps}<p
									id="max-jumps-error"
									class="text-error mt-1 text-sm"
								>
									{translate($locale, errors.maxJumps)}
								</p>{/if}
						</div>

						<div class="fieldset p-0">
							<label class="label font-semibold" for="maxRuns"
								>{translate($locale, 'event.maxRunsLabel')}</label
							>
							<input
								id="maxRuns"
								class="input numeric w-full"
								name="maxRuns"
								type="text"
								inputmode="numeric"
								enterkeyhint="done"
								required
								bind:value={maxRuns}
								aria-invalid={errors.maxRuns ? 'true' : undefined}
								aria-describedby={`max-runs-hint${errors.maxRuns ? ' max-runs-error' : ''}`}
								onblur={() => validateAndSet('maxRuns')}
								oninput={(event) => handleFieldInput('maxRuns', event)}
							/>
							<p id="max-runs-hint" class="text-base-content/60 mt-1 text-sm">
								{translate($locale, 'event.maxRunsHint')}
							</p>
							{#if errors.maxRuns}<p
									id="max-runs-error"
									class="text-error mt-1 text-sm"
								>
									{translate($locale, errors.maxRuns)}
								</p>{/if}
						</div>
					</div>
				</details>

				<div class="mt-5 grid gap-2 sm:grid-cols-[1fr_auto]">
					<button class="btn btn-primary" type="submit"
						>{translate($locale, 'event.calculate')}</button
					>
					<button class="btn" type="button" onclick={loadExample}
						>{translate($locale, 'event.example')}</button
					>
				</div>
			</div>
		</form>

		<section class="min-w-0 space-y-4" aria-labelledby="result-heading">
			<h2 id="result-heading" class="sr-only">
				{translate($locale, 'event.resultHeading')}
			</h2>

			{#if queryNotice}
				<div class="alert alert-warning" role="status">
					<span>{translate($locale, 'event.queryIgnored')}</span>
				</div>
			{/if}

			{#if !result}
				<div class="card bg-base-100 shadow-sm">
					<div class="card-body p-5 sm:p-6">
						<h3 class="card-title text-lg">
							{translate($locale, 'event.resultHeading')}
						</h3>
						<p class="text-base-content/70">
							{translate($locale, 'event.emptyBody')}
						</p>
					</div>
				</div>
			{:else if !result.ok}
				<div class="alert alert-error items-start" role="alert">
					<div>
						<h3 class="font-bold">
							{translate($locale, 'event.resultHeading')}
						</h3>
						<p class="mt-1">
							{translate($locale, resultErrorMessage(result))}
						</p>
					</div>
				</div>
			{:else if result.delta === 0n}
				<div
					class="card bg-base-100 shadow-sm"
					role="status"
					aria-live="polite"
					aria-atomic="true"
				>
					<div class="card-body p-5 sm:p-6">
						<h3 class="card-title text-lg">
							{translate($locale, 'event.noPlayHeading')}
						</h3>
						<p class="text-base-content/70">
							{translate($locale, 'event.noPlayBody')}
						</p>
					</div>
				</div>
			{:else}
				<div
					class="stats bg-base-100 w-full shadow-sm"
					role="status"
					aria-live="polite"
					aria-atomic="true"
				>
					<div class="stat">
						<div class="stat-title">
							{translate($locale, 'event.resultHeading')}
						</div>
						<div class="stat-value numeric text-3xl">
							{translate($locale, 'event.delta', {
								points: formatInteger($locale, result.delta)
							})}
						</div>
						<div class="stat-desc mt-1">
							{translate(
								$locale,
								result.plans.length === 1
									? 'event.planCountOne'
									: 'event.planCount',
								{ count: result.plans.length }
							)}
						</div>
					</div>
				</div>

				{#if result.inferred}
					<div class="alert alert-warning" role="status">
						<span>{translate($locale, 'event.inferred')}</span>
					</div>
				{/if}

				<div class="grid gap-4">
					{#each result.plans as plan, index}
						<article class="card bg-base-100 shadow-sm">
							<div class="card-body gap-4 p-5 sm:p-6">
								<header
									class="flex flex-wrap items-center justify-between gap-3"
								>
									<h3 class="card-title text-lg">
										{translate($locale, 'event.planLabel', {
											index: index + 1
										})}
									</h3>
									<span class="badge badge-outline"
										>{translate(
											$locale,
											plan.plays === 1 ? 'event.playsOne' : 'event.plays',
											{ count: plan.plays }
										)}</span
									>
								</header>

								<div class="overflow-x-auto">
									<table class="table-sm table">
										<tbody>
											{#each groupPlan(plan) as group}
												<tr>
													<th class="numeric" scope="row">
														{group.count === 1
															? translate(
																	$locale,
																	group.jumps === 1
																		? 'event.actionOne'
																		: 'event.action',
																	{ jumps: group.jumps }
																)
															: translate(
																	$locale,
																	group.jumps === 1
																		? 'event.actionRepeatedOne'
																		: 'event.actionRepeated',
																	{ jumps: group.jumps, count: group.count }
																)}
													</th>
													<td class="numeric text-right">
														{translate($locale, 'event.actionReward', {
															points: formatInteger($locale, group.reward)
														})}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>

								<footer
									class="border-base-300 numeric flex flex-wrap justify-between gap-2 border-t pt-3 text-sm"
								>
									<span
										>{translate(
											$locale,
											plan.totalJumps === 1
												? 'event.totalJumpsOne'
												: 'event.totalJumps',
											{ count: plan.totalJumps }
										)}</span
									>
									<span
										>{translate($locale, 'event.planReward', {
											points: formatInteger($locale, plan.reward)
										})}</span
									>
								</footer>
							</div>
						</article>
					{/each}
				</div>

				<button
					class="btn btn-outline w-full"
					type="button"
					onclick={copyCurrentUrl}>{translate($locale, 'event.copyUrl')}</button
				>
				{#if copyStatus}<p class="text-base-content/70 text-sm" role="status">
						{translate($locale, copyStatus)}
					</p>{/if}
			{/if}
		</section>
	</div>

	<details class="collapse-arrow bg-base-100 collapse mt-6 shadow-sm">
		<summary class="collapse-title text-lg font-semibold"
			>{translate($locale, 'event.formulaHeading')}</summary
		>
		<div class="collapse-content">
			<p class="text-base-content/70">
				{translate($locale, 'event.formulaIntro')}
			</p>
			<div class="mt-4 grid gap-2">
				<code
					class="bg-base-200 numeric block overflow-x-auto rounded p-3 text-sm"
					>{translate($locale, 'event.formulaBase')}</code
				>
				<code
					class="bg-base-200 numeric block overflow-x-auto rounded p-3 text-sm"
					>{translate($locale, 'event.formulaReward')}</code
				>
			</div>
			<div class="text-base-content/70 mt-4 grid gap-2 text-sm">
				<p>{translate($locale, 'event.formulaBoundary')}</p>
				<p>{translate($locale, 'event.serverNote')}</p>
				<p>{translate($locale, 'event.boostNote')}</p>
			</div>
			<a
				class="link link-primary mt-4 inline-block"
				href="https://forum.gamer.com.tw/C.php?bsn=84454&last=1&snA=600&tnum=1"
				target="_blank"
				rel="noreferrer"
			>
				{translate($locale, 'event.source')}
			</a>
		</div>
	</details>

	<footer class="text-base-content/60 mt-6 text-center text-xs">
		{translate($locale, 'event.unofficial')}
	</footer>
</div>
