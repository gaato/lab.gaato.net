<script lang="ts">
	import { onMount } from 'svelte';
	import {
		AutomatonLabController,
		type AutomatonRunState
	} from '$lib/automaton/controller';
	import {
		AUTOMATON_RULES,
		findAutomatonRule,
		parseAutomatonRule,
		type AutomatonRule
	} from '$lib/automaton/rules';
	import { locale, translate } from '$lib/i18n';

	type Props = {
		initialRuleId?: string;
		seed?: number;
	};

	let { initialRuleId, seed }: Props = $props();
	let host: HTMLDivElement;
	let canvasHost: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let controller: AutomatonLabController | undefined;
	let selectedRule = $state<AutomatonRule>(AUTOMATON_RULES[0]);
	let ruleInput = $state(AUTOMATON_RULES[0].notation);
	let ruleError = $state(false);
	let paused = $state(false);
	let reducedMotion = $state(false);
	let forcedColors = $state(false);
	let available = $state(true);

	const selectedRuleName = $derived(
		selectedRule.name === 'Custom'
			? translate($locale, 'automaton.custom')
			: selectedRule.name
	);

	onMount(() => {
		const initialRule = findAutomatonRule(initialRuleId) ?? AUTOMATON_RULES[0];
		selectedRule = initialRule;
		ruleInput = initialRule.notation;
		controller = new AutomatonLabController({
			host: canvasHost,
			visibilityHost: host,
			canvas,
			rule: initialRule,
			seed: seed ?? createSeed(),
			paused,
			onRunStateChange: handleRunStateChange
		});
		available = controller.start();

		return () => {
			controller?.destroy();
			controller = undefined;
		};
	});

	function createSeed(): number {
		if (
			typeof crypto !== 'undefined' &&
			typeof crypto.getRandomValues === 'function'
		) {
			return crypto.getRandomValues(new Uint32Array(1))[0] & 0x7fff_ffff;
		}
		return (Date.now() ^ Math.floor(Math.random() * 0x7fff_ffff)) & 0x7fff_ffff;
	}

	function handleRunStateChange(state: AutomatonRunState): void {
		reducedMotion = state.reducedMotion;
		forcedColors = state.forcedColors;
		available = state.available;
	}

	function handleRuleInput(event: Event): void {
		const input = event.currentTarget as HTMLInputElement;
		ruleInput = input.value;
		ruleError = false;
		input.setCustomValidity('');
	}

	function applyRule(event: SubmitEvent): void {
		event.preventDefault();
		const form = event.currentTarget as HTMLFormElement;
		const input = form.elements.namedItem('rule') as HTMLInputElement;
		const rule = parseAutomatonRule(ruleInput);
		if (!rule) {
			ruleError = true;
			input.setCustomValidity(translate($locale, 'automaton.ruleInvalid'));
			input.reportValidity();
			return;
		}

		input.setCustomValidity('');
		ruleError = false;
		ruleInput = rule.notation;
		selectedRule = rule;
		controller?.setRule(rule);
	}

	function togglePaused(): void {
		paused = !paused;
		controller?.setPaused(paused);
	}

	function stepOnce(): void {
		controller?.stepOnce();
	}

	function reset(): void {
		controller?.reset();
	}

	function addSeed(): void {
		controller?.seedCenter();
	}
</script>

<div class="automaton-lab" data-testid="automaton-lab" bind:this={host}>
	<div class="card bg-base-100 shadow-sm">
		<div class="card-body gap-4 p-5 sm:p-6">
			<form onsubmit={applyRule}>
				<fieldset class="fieldset">
					<legend id="automaton-rule-label" class="fieldset-legend"
						>{translate($locale, 'automaton.rule')}</legend
					>
					<p id="automaton-rule-help" class="label">
						{translate($locale, 'automaton.ruleHelp')}
					</p>
					<div class="flex min-w-0 flex-col gap-2 sm:flex-row">
						<input
							id="automaton-rule"
							name="rule"
							class:input-error={ruleError}
							class="input min-h-12 min-w-0 flex-1"
							data-testid="automaton-rule"
							value={ruleInput}
							oninput={handleRuleInput}
							aria-describedby={ruleError
								? 'automaton-rule-help automaton-rule-error'
								: 'automaton-rule-help'}
							aria-labelledby="automaton-rule-label"
							aria-invalid={ruleError ? 'true' : 'false'}
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							disabled={!available || forcedColors}
						/>
						<button
							class="btn min-h-12"
							type="submit"
							disabled={!available || forcedColors}
						>
							{translate($locale, 'automaton.apply')}
						</button>
					</div>
					{#if ruleError}
						<p
							id="automaton-rule-error"
							class="text-error text-sm"
							aria-live="polite"
						>
							{translate($locale, 'automaton.ruleInvalid')}
						</p>
					{/if}
				</fieldset>
			</form>

			<div
				class="flex flex-wrap gap-2"
				aria-label={translate($locale, 'automaton.controls')}
			>
				<button
					class="btn min-h-12"
					type="button"
					aria-pressed={paused}
					data-testid="automaton-toggle"
					onclick={togglePaused}
					disabled={!available || reducedMotion || forcedColors}
				>
					{translate($locale, paused ? 'automaton.resume' : 'automaton.pause')}
				</button>
				<button
					class="btn min-h-12"
					type="button"
					data-testid="automaton-step"
					onclick={stepOnce}
					disabled={!available || forcedColors}
				>
					{translate($locale, 'automaton.step')}
				</button>
				<button
					class="btn min-h-12"
					type="button"
					data-testid="automaton-reset"
					onclick={reset}
					disabled={!available || forcedColors}
				>
					{translate($locale, 'automaton.reset')}
				</button>
				<button
					class="btn min-h-12"
					type="button"
					data-testid="automaton-seed"
					onclick={addSeed}
					disabled={!available || forcedColors}
				>
					{translate($locale, 'automaton.addSeed')}
				</button>
			</div>

			<output class="text-base-content/70 text-sm" aria-live="polite">
				{selectedRuleName}
				{selectedRule.notation}
			</output>
			{#if reducedMotion}
				<p class="text-base-content/70 text-sm">
					{translate($locale, 'automaton.reducedMotion')}
				</p>
			{/if}
			{#if forcedColors}
				<p class="text-base-content/70 text-sm">
					{translate($locale, 'automaton.forcedColors')}
				</p>
			{/if}
			{#if !available}
				<p class="text-base-content/70 text-sm">
					{translate($locale, 'automaton.unavailable')}
				</p>
			{/if}
		</div>
	</div>

	<div
		class="automaton-canvas border-base-300 bg-base-100 rounded-box mt-4 h-[clamp(18rem,60dvb,42rem)] overflow-hidden border"
		class:hidden={forcedColors}
		bind:this={canvasHost}
		role="img"
		aria-label={translate($locale, 'automaton.canvasLabel', {
			name: selectedRuleName,
			notation: selectedRule.notation
		})}
	>
		<canvas bind:this={canvas} aria-hidden="true"></canvas>
	</div>
</div>

<style>
	.automaton-lab {
		content-visibility: auto;
		contain-intrinsic-block-size: auto 48rem;
	}

	canvas {
		display: block;
		inline-size: 100%;
		block-size: 100%;
		touch-action: pan-y pinch-zoom;
	}

	@media (forced-colors: active) {
		.automaton-canvas {
			border-color: CanvasText;
		}
	}
</style>
