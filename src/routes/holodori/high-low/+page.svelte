<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import AnalysisWorker from '$lib/high-low.worker?worker';
	import ToolShare from '$lib/ToolShare.svelte';
	import {
		HAND_RANKS,
		RANKS,
		SUITS,
		cardKey,
		type Card,
		type HandAnalysis,
		type HandRank,
		type HoldStrategy,
		type Rank,
		type Suit
	} from '$lib/high-low';
	import {
		DAILY_HIGH_LOW_LEGACY_STORAGE_KEY,
		DAILY_HIGH_LOW_LIMIT,
		DAILY_HIGH_LOW_STORAGE_KEY,
		DAILY_HIGH_LOW_TARGET,
		DAILY_HIGH_LOW_UNIVERSAL_READY_MIN,
		PAYING_HAND_RANKS,
		calculateDailyEntryPayout,
		calculateDailySubtotal,
		createDailyHighLowProgress,
		loadDailyHighLowProgress,
		millisecondsUntilDailyHighLowReset,
		recommendDailyCashout,
		type DailyHighLowProgressV2,
		type DailyRouteRecommendation,
		type PayingHandRank
	} from '$lib/high-low-daily';
	import type {
		HighLowWorkerRequest,
		HighLowWorkerResponse
	} from '$lib/high-low-worker';
	import {
		formatInteger,
		locale,
		translate,
		type Locale,
		type MessageKey
	} from '$lib/i18n';

	type CardSlot = Card | null;

	const HAND_SIZE = 5;
	const suitSymbols: Record<Suit, string> = {
		spades: '♠',
		hearts: '♥',
		diamonds: '♦',
		clubs: '♣'
	};

	let cards: CardSlot[] = Array<CardSlot>(HAND_SIZE).fill(null);
	let selectedIndex = 0;
	let selectedRank: Rank | null = null;
	let selectedSuit: Suit | null = null;
	let duplicateError = false;
	let loading = false;
	let analysisError = false;
	let analysis: HandAnalysis | null = null;
	let analysisWorker: Worker | null = null;
	let analysisTimer: ReturnType<typeof setTimeout> | null = null;
	let requestSequence = 0;
	let dailyProgress: DailyHighLowProgressV2 = createDailyHighLowProgress();
	let selectedDailyRank: PayingHandRank | null = null;
	let selectedDailyDoubleUps: number | null = null;
	let dailyStorageError = false;
	let dailyResetArmed = false;
	let dailyResetTimer: ReturnType<typeof setTimeout> | null = null;

	$: selectedCard = cards[selectedIndex];
	$: selectedCardIsJoker = selectedCard?.kind === 'joker';
	$: completedCardCount = cards.filter((card) => card !== null).length;
	$: remainingCardCount = HAND_SIZE - completedCardCount;
	$: primaryStrategy = analysis?.bestStrategies[0] ?? null;
	$: alternativeStrategies = analysis
		? analysis.strategies
				.filter(
					(strategy) =>
						!analysis?.bestStrategies.some(
							(best) => best.holdMask === strategy.holdMask
						)
				)
				.slice(0, 2)
		: [];
	$: dailySubtotal = calculateDailySubtotal(dailyProgress.entries);
	$: dailyRecommendation = selectedDailyRank
		? recommendDailyCashout(dailySubtotal, selectedDailyRank)
		: null;
	$: dailyDoubleUpOptions = dailyRecommendation?.options ?? [];
	$: selectedDailyOption =
		dailyDoubleUpOptions.find(
			(option) => option.successfulDoubleUps === selectedDailyDoubleUps
		) ?? null;
	$: dailyHistoryRows = dailyProgress.entries
		.map((entry, index) => ({
			entry,
			index,
			payout: calculateDailyEntryPayout(entry)
		}))
		.reverse();

	function suitMessageKey(suit: Suit): MessageKey {
		switch (suit) {
			case 'spades':
				return 'highLow.suit.spade';
			case 'hearts':
				return 'highLow.suit.heart';
			case 'diamonds':
				return 'highLow.suit.diamond';
			case 'clubs':
				return 'highLow.suit.club';
		}
	}

	function handRankMessageKey(rank: HandRank): MessageKey {
		switch (rank) {
			case 'high-card':
				return 'highLow.hand.none';
			case 'one-pair':
				return 'highLow.hand.onePair';
			case 'two-pair':
				return 'highLow.hand.twoPair';
			case 'three-of-a-kind':
				return 'highLow.hand.threeCard';
			case 'straight':
				return 'highLow.hand.straight';
			case 'flush':
				return 'highLow.hand.flush';
			case 'full-house':
				return 'highLow.hand.fullHouse';
			case 'four-of-a-kind':
				return 'highLow.hand.fourCard';
			case 'straight-flush':
				return 'highLow.hand.straightFlush';
			case 'five-of-a-kind':
				return 'highLow.hand.fiveCard';
			case 'royal-straight-flush':
				return 'highLow.hand.royalStraightFlush';
		}
	}

	function cardText(activeLocale: Locale, card: Card): string {
		return card.kind === 'joker'
			? translate(activeLocale, 'highLow.joker')
			: `${card.rank}${suitSymbols[card.suit]}`;
	}

	function cardAccessibleText(activeLocale: Locale, card: Card): string {
		return card.kind === 'joker'
			? translate(activeLocale, 'highLow.joker')
			: `${card.rank} ${translate(activeLocale, suitMessageKey(card.suit))}`;
	}

	function cardSlotLabel(
		activeLocale: Locale,
		card: CardSlot,
		index: number
	): string {
		const position = translate(activeLocale, 'highLow.cardSlot', {
			index: index + 1
		});
		const value = card
			? cardAccessibleText(activeLocale, card)
			: translate(activeLocale, 'highLow.emptyCard');
		const active =
			selectedIndex === index
				? ` ${translate(activeLocale, 'highLow.activeCard')}`
				: '';
		return `${position} ${value}${active}`;
	}

	function formatDecimal(activeLocale: Locale, value: number): string {
		return new Intl.NumberFormat(activeLocale === 'ja' ? 'ja-JP' : 'en-US', {
			maximumFractionDigits: 2
		}).format(value);
	}

	function formatProbability(activeLocale: Locale, value: number): string {
		return new Intl.NumberFormat(activeLocale === 'ja' ? 'ja-JP' : 'en-US', {
			style: 'percent',
			maximumFractionDigits: 2
		}).format(value);
	}

	function completeHand(nextCards: CardSlot[]): Card[] | null {
		if (nextCards.some((card) => card === null)) return null;
		return nextCards as Card[];
	}

	function stopWorker(): void {
		if (analysisTimer !== null) {
			clearTimeout(analysisTimer);
			analysisTimer = null;
		}
		analysisWorker?.terminate();
		analysisWorker = null;
	}

	function invalidateAnalysis(): void {
		requestSequence += 1;
		stopWorker();
		loading = false;
		analysisError = false;
		analysis = null;
	}

	function startAnalysis(hand: Card[]): void {
		const requestId = ++requestSequence;
		let nextWorker: Worker;
		try {
			nextWorker = new AnalysisWorker();
		} catch {
			loading = false;
			analysisError = true;
			return;
		}

		analysisWorker = nextWorker;
		nextWorker.onmessage = (event: MessageEvent<HighLowWorkerResponse>) => {
			if (analysisWorker !== nextWorker || event.data.requestId !== requestId) {
				return;
			}
			loading = false;
			analysisWorker = null;
			nextWorker.terminate();
			if (event.data.type === 'result') {
				analysis = event.data.result;
				analysisError = false;
				return;
			}
			analysis = null;
			analysisError = true;
		};
		nextWorker.onerror = (event) => {
			event.preventDefault();
			if (analysisWorker !== nextWorker || requestSequence !== requestId)
				return;
			loading = false;
			analysis = null;
			analysisError = true;
			analysisWorker = null;
			nextWorker.terminate();
		};

		const request: HighLowWorkerRequest = {
			type: 'analyze',
			requestId,
			hand
		};
		nextWorker.postMessage(request);
	}

	function scheduleAnalysis(nextCards: CardSlot[]): void {
		invalidateAnalysis();
		const hand = completeHand(nextCards);
		if (!hand) return;
		loading = true;
		analysisTimer = setTimeout(() => {
			analysisTimer = null;
			startAnalysis(hand);
		}, 80);
	}

	function setSelectedCard(index: number): void {
		selectedIndex = index;
		duplicateError = false;
		const card = cards[index];
		if (card?.kind === 'standard') {
			selectedRank = card.rank;
			selectedSuit = card.suit;
			return;
		}
		selectedRank = null;
		selectedSuit = null;
	}

	function advanceFrom(index: number, nextCards: CardSlot[]): void {
		for (let offset = 1; offset <= HAND_SIZE; offset += 1) {
			const candidate = (index + offset) % HAND_SIZE;
			if (nextCards[candidate] === null) {
				setSelectedCard(candidate);
				return;
			}
		}
	}

	function isDuplicate(candidate: Card): boolean {
		const candidateKey = cardKey(candidate);
		return cards.some(
			(card, index) =>
				index !== selectedIndex &&
				card !== null &&
				cardKey(card) === candidateKey
		);
	}

	function commitCard(card: Card): void {
		if (isDuplicate(card)) {
			duplicateError = true;
			return;
		}

		duplicateError = false;
		const nextCards = cards.with(selectedIndex, card);
		cards = nextCards;
		if (card.kind === 'standard') {
			selectedRank = card.rank;
			selectedSuit = card.suit;
		} else {
			selectedRank = null;
			selectedSuit = null;
		}
		scheduleAnalysis(nextCards);
		advanceFrom(selectedIndex, nextCards);
	}

	function chooseRank(rank: Rank): void {
		selectedRank = rank;
		duplicateError = false;
		if (selectedSuit) {
			commitCard({ kind: 'standard', rank, suit: selectedSuit });
		}
	}

	function chooseSuit(suit: Suit): void {
		selectedSuit = suit;
		duplicateError = false;
		if (selectedRank) {
			commitCard({ kind: 'standard', rank: selectedRank, suit });
		}
	}

	function chooseJoker(): void {
		commitCard({ kind: 'joker' });
	}

	function clearSelectedCard(): void {
		const nextCards = cards.with(selectedIndex, null);
		cards = nextCards;
		selectedRank = null;
		selectedSuit = null;
		duplicateError = false;
		scheduleAnalysis(nextCards);
	}

	function clearAllCards(): void {
		cards = Array<CardSlot>(HAND_SIZE).fill(null);
		selectedIndex = 0;
		selectedRank = null;
		selectedSuit = null;
		duplicateError = false;
		invalidateAnalysis();
	}

	function strategyHeading(
		activeLocale: Locale,
		strategy: HoldStrategy
	): string {
		return strategy.heldIndices.length === 0
			? translate(activeLocale, 'highLow.replaceAll')
			: translate(activeLocale, 'highLow.keepCount', {
					count: strategy.heldIndices.length
				});
	}

	function strategyKeepsCard(strategy: HoldStrategy, index: number): boolean {
		return (strategy.holdMask & (1 << index)) !== 0;
	}

	function strategyCardList(
		activeLocale: Locale,
		strategy: HoldStrategy
	): string {
		if (strategy.heldIndices.length === 0) {
			return translate(activeLocale, 'highLow.replaceAll');
		}
		return strategy.heldIndices
			.map((index) => cardText(activeLocale, cards[index]!))
			.join(' ');
	}

	function dailyStageText(activeLocale: Locale, subtotal: number): string {
		if (subtotal >= DAILY_HIGH_LOW_TARGET) {
			return translate(activeLocale, 'highLow.daily.reached');
		}
		if (subtotal >= DAILY_HIGH_LOW_LIMIT) {
			return translate(activeLocale, 'highLow.daily.closedBelow');
		}
		if (subtotal >= DAILY_HIGH_LOW_UNIVERSAL_READY_MIN) {
			return translate(activeLocale, 'highLow.daily.ready');
		}
		return translate(activeLocale, 'highLow.daily.building');
	}

	function dailyRecommendationText(
		activeLocale: Locale,
		recommendation: DailyRouteRecommendation | null,
		subtotal: number
	): string {
		const option = recommendation?.recommended;
		if (!recommendation || !option) {
			return subtotal >= DAILY_HIGH_LOW_LIMIT
				? dailyStageText(activeLocale, subtotal)
				: translate(activeLocale, 'highLow.daily.selectHand');
		}
		const parameters = {
			count: option.successfulDoubleUps,
			payout: formatInteger(activeLocale, option.payout),
			total: formatInteger(activeLocale, option.subtotalAfter)
		};
		switch (recommendation.basis) {
			case 'finish-now':
				return translate(
					activeLocale,
					'highLow.daily.recommendFinish',
					parameters
				);
			case 'universal-ready':
				return translate(
					activeLocale,
					'highLow.daily.recommendReady',
					parameters
				);
			case 'progress':
				return translate(
					activeLocale,
					'highLow.daily.recommendProgress',
					parameters
				);
			case 'day-closed':
				return dailyStageText(activeLocale, subtotal);
		}
	}

	function writeDailyProgress(progress: DailyHighLowProgressV2): boolean {
		try {
			localStorage.setItem(
				DAILY_HIGH_LOW_STORAGE_KEY,
				JSON.stringify(progress)
			);
			dailyStorageError = false;
			return true;
		} catch {
			dailyStorageError = true;
			return false;
		}
	}

	function replaceDailyProgress(progress: DailyHighLowProgressV2): void {
		dailyProgress = progress;
		dailyResetArmed = false;
		writeDailyProgress(progress);
	}

	function clearDailySelection(): void {
		selectedDailyRank = null;
		selectedDailyDoubleUps = null;
	}

	function resetDailyProgress(now: Date = new Date()): void {
		clearDailySelection();
		replaceDailyProgress(createDailyHighLowProgress(now));
	}

	function scheduleDailyReset(): void {
		if (dailyResetTimer !== null) clearTimeout(dailyResetTimer);
		dailyResetTimer = setTimeout(() => {
			resetDailyProgress(new Date());
			scheduleDailyReset();
		}, millisecondsUntilDailyHighLowReset());
	}

	function selectDailyRank(event: Event): void {
		const value = (event.currentTarget as HTMLSelectElement).value;
		selectedDailyRank = value ? (value as PayingHandRank) : null;
		selectedDailyDoubleUps = null;
	}

	function selectDailyDoubleUps(event: Event): void {
		const value = (event.currentTarget as HTMLSelectElement).value;
		selectedDailyDoubleUps = value === '' ? null : Number(value);
	}

	function recordDailyPayout(): void {
		if (!selectedDailyRank || !selectedDailyOption) return;
		replaceDailyProgress({
			...dailyProgress,
			entries: [
				...dailyProgress.entries,
				{
					kind: 'cashout',
					handRank: selectedDailyRank,
					successfulDoubleUps: selectedDailyOption.successfulDoubleUps
				}
			]
		});
		clearDailySelection();
	}

	function removeDailyPayout(index: number): void {
		replaceDailyProgress({
			...dailyProgress,
			entries: dailyProgress.entries.filter(
				(_entry, entryIndex) => entryIndex !== index
			)
		});
	}

	function handleDailyReset(): void {
		if (!dailyResetArmed) {
			dailyResetArmed = true;
			return;
		}
		resetDailyProgress();
	}

	async function startNextGame(): Promise<void> {
		clearDailySelection();
		clearAllCards();
		await tick();
		document.getElementById('high-low-card-slot-1')?.focus();
	}

	onMount(() => {
		try {
			const loaded = loadDailyHighLowProgress(
				localStorage.getItem(DAILY_HIGH_LOW_STORAGE_KEY),
				localStorage.getItem(DAILY_HIGH_LOW_LEGACY_STORAGE_KEY)
			);
			dailyProgress = loaded.progress;
			if (
				loaded.status === 'migrated' ||
				loaded.status === 'new-day' ||
				loaded.status === 'invalid'
			) {
				const saved = writeDailyProgress(loaded.progress);
				if (saved && loaded.removeLegacyAfterSave) {
					localStorage.removeItem(DAILY_HIGH_LOW_LEGACY_STORAGE_KEY);
				}
			}
		} catch {
			dailyStorageError = true;
		}
		scheduleDailyReset();
		return () => {
			if (dailyResetTimer !== null) clearTimeout(dailyResetTimer);
		};
	});

	onDestroy(stopWorker);
</script>

<svelte:head>
	<title>{translate($locale, 'highLow.title')}</title>
	<meta
		name="description"
		content={translate($locale, 'highLow.description')}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="lab.gaato.net" />
	<meta property="og:title" content={translate($locale, 'highLow.title')} />
	<meta
		property="og:description"
		content={translate($locale, 'highLow.description')}
	/>
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
	<nav
		class="breadcrumbs mb-2 text-sm"
		aria-label={translate($locale, 'site.breadcrumbs')}
	>
		<ul>
			<li><a href="/?lang={$locale}">{translate($locale, 'site.home')}</a></li>
			<li>
				<a href="/holodori/?lang={$locale}"
					>{translate($locale, 'site.holodori')}</a
				>
			</li>
			<li>{translate($locale, 'highLow.heading')}</li>
		</ul>
	</nav>

	<header>
		<h1 class="text-2xl font-bold">
			{translate($locale, 'highLow.heading')}
		</h1>
	</header>
	<p class="text-base-content/70 mt-2 text-sm">
		{translate($locale, 'highLow.summary')}
	</p>

	<section
		class="stats stats-vertical bg-base-100 sm:stats-horizontal mt-6 w-full shadow-sm"
		aria-label={translate($locale, 'highLow.daily.statusLabel')}
	>
		<div class="stat p-4">
			<div class="stat-title">
				{translate($locale, 'highLow.daily.received')}
			</div>
			<div class="stat-value numeric text-2xl">
				{translate($locale, 'highLow.daily.progress', {
					value: formatInteger($locale, dailySubtotal),
					target: formatInteger($locale, DAILY_HIGH_LOW_TARGET)
				})}
			</div>
		</div>
		<div class="stat p-4">
			<div class="stat-title">{translate($locale, 'highLow.daily.next')}</div>
			<div class="stat-desc mt-1 whitespace-normal">
				{dailyStageText($locale, dailySubtotal)}
			</div>
			<div class="stat-actions mt-2">
				<a class="btn btn-ghost btn-sm" href="#daily-route-heading">
					{translate($locale, 'highLow.daily.historyLink')}
				</a>
			</div>
		</div>
	</section>

	<div class="mt-6 grid items-start gap-6 lg:grid-cols-2">
		<div class="card bg-base-100 shadow-sm">
			<div class="card-body gap-5 p-5 sm:p-6">
				<fieldset class="fieldset gap-3 p-0">
					<legend class="fieldset-legend p-0 text-lg font-bold">
						{translate($locale, 'highLow.handLegend')}
					</legend>

					<div class="grid grid-cols-5 gap-2">
						{#each cards as card, index}
							<button
								id={index === 0 ? 'high-low-card-slot-1' : undefined}
								class={`btn min-h-24 min-w-0 flex-col gap-1 px-1 ${selectedIndex === index ? 'btn-primary' : 'btn-outline'}`}
								type="button"
								aria-label={cardSlotLabel($locale, card, index)}
								aria-pressed={selectedIndex === index}
								onclick={() => setSelectedCard(index)}
							>
								<span class="text-[0.6875rem] font-medium sm:text-xs">
									{translate($locale, 'highLow.cardSlot', { index: index + 1 })}
								</span>
								<span
									class={`text-lg leading-none font-bold sm:text-xl ${card?.kind === 'standard' && (card.suit === 'hearts' || card.suit === 'diamonds') ? 'text-error' : ''}`}
								>
									{card ? cardText($locale, card) : ' '}
								</span>
								<span class="text-[0.625rem] font-medium sm:text-xs">
									{!card
										? translate($locale, 'highLow.emptyCard')
										: selectedIndex === index
											? translate($locale, 'highLow.activeCard')
											: ' '}
								</span>
							</button>
						{/each}
					</div>
				</fieldset>

				<div class="grid gap-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
					<fieldset class="fieldset gap-2 p-0">
						<legend class="fieldset-legend p-0 font-semibold">
							{translate($locale, 'highLow.rankLegend')}
						</legend>
						<div class="grid grid-cols-5 gap-2">
							{#each RANKS as rank}
								<button
									class={`btn min-h-12 min-w-0 px-1 ${!selectedCardIsJoker && selectedRank === rank ? 'btn-primary' : 'btn-outline'}`}
									type="button"
									aria-pressed={!selectedCardIsJoker && selectedRank === rank}
									onclick={() => chooseRank(rank)}>{rank}</button
								>
							{/each}
							<button
								class={`btn col-span-2 min-h-12 min-w-0 px-1 text-xs ${selectedCardIsJoker ? 'btn-primary' : 'btn-outline'}`}
								type="button"
								aria-pressed={selectedCardIsJoker}
								onclick={chooseJoker}
							>
								{translate($locale, 'highLow.joker')}
							</button>
						</div>
					</fieldset>

					<fieldset class="fieldset gap-2 p-0">
						<legend class="fieldset-legend p-0 font-semibold">
							{translate($locale, 'highLow.suitLegend')}
						</legend>
						<div class="grid grid-cols-4 gap-2 sm:grid-cols-2">
							{#each SUITS as suit}
								<button
									class={`btn min-h-12 text-xl ${!selectedCardIsJoker && selectedSuit === suit ? 'btn-primary' : 'btn-outline'} ${suit === 'hearts' || suit === 'diamonds' ? 'text-error' : ''}`}
									type="button"
									aria-label={translate($locale, suitMessageKey(suit))}
									aria-pressed={!selectedCardIsJoker && selectedSuit === suit}
									onclick={() => chooseSuit(suit)}
								>
									<span aria-hidden="true">{suitSymbols[suit]}</span>
								</button>
							{/each}
						</div>
					</fieldset>
				</div>

				<div aria-live="assertive" aria-atomic="true">
					{#if duplicateError}
						<div class="alert alert-error py-3" role="alert">
							<span>{translate($locale, 'highLow.duplicateCard')}</span>
						</div>
					{/if}
				</div>

				<div class="grid grid-cols-2 gap-3">
					<button
						class="btn btn-outline min-h-12"
						type="button"
						disabled={!cards[selectedIndex]}
						onclick={clearSelectedCard}
					>
						{translate($locale, 'highLow.clearCard')}
					</button>
					<button
						class="btn btn-ghost min-h-12"
						type="button"
						disabled={completedCardCount === 0}
						onclick={clearAllCards}
					>
						{translate($locale, 'highLow.clearAll')}
					</button>
				</div>
			</div>
		</div>

		<section class="min-w-0 space-y-4" aria-labelledby="result-heading">
			<h2 id="result-heading" class="sr-only">
				{translate($locale, 'highLow.resultHeading')}
			</h2>

			<div aria-live="polite" aria-atomic="true">
				{#if loading}
					<div class="card bg-base-100 shadow-sm" role="status">
						<div class="card-body gap-4 p-5 sm:p-6">
							<h3 class="card-title text-lg">
								{translate($locale, 'highLow.resultHeading')}
							</h3>
							<div class="flex items-center gap-3">
								<span
									class="loading loading-spinner loading-md"
									aria-hidden="true"
								></span>
								<span>{translate($locale, 'highLow.calculating')}</span>
							</div>
							<div class="skeleton h-20 w-full" aria-hidden="true"></div>
						</div>
					</div>
				{:else if analysisError}
					<div class="alert alert-error items-start" role="alert">
						<div>
							<h3 class="font-bold">
								{translate($locale, 'highLow.resultHeading')}
							</h3>
							<p class="mt-1">{translate($locale, 'highLow.analysisError')}</p>
						</div>
					</div>
				{:else if !analysis || !primaryStrategy}
					<div class="card bg-base-100 shadow-sm">
						<div class="card-body p-5 sm:p-6">
							<h3 class="card-title text-lg">
								{translate($locale, 'highLow.resultHeading')}
							</h3>
							<p class="text-base-content/70">
								{translate($locale, 'highLow.waiting')}
							</p>
							{#if remainingCardCount > 0}
								<span class="badge badge-outline mt-2">
									{translate($locale, 'highLow.waitingCount', {
										count: remainingCardCount
									})}
								</span>
							{/if}
						</div>
					</div>
				{:else}
					<div class="space-y-4">
						{#if analysis.bestStrategies.length > 1}
							<div class="alert alert-info py-3" role="status">
								<span>
									{translate($locale, 'highLow.tied', {
										count: analysis.bestStrategies.length
									})}
								</span>
							</div>
						{/if}

						{#each analysis.bestStrategies as strategy}
							<article class="card bg-base-100 shadow-sm">
								<div class="card-body gap-4 p-5 sm:p-6">
									<h3 class="card-title text-lg">
										{strategyHeading($locale, strategy)}
									</h3>

									<div class="grid grid-cols-5 gap-2">
										{#each cards as card, index}
											<div
												class={`border-base-300 rounded-box flex min-h-20 min-w-0 flex-col items-center justify-center gap-1 border px-1 text-center ${strategyKeepsCard(strategy, index) ? 'bg-success/15' : 'bg-base-200'}`}
											>
												<strong
													class={`text-lg leading-none ${card?.kind === 'standard' && (card.suit === 'hearts' || card.suit === 'diamonds') ? 'text-error' : ''}`}
													>{card ? cardText($locale, card) : ''}</strong
												>
												<span class="text-[0.6875rem] font-semibold sm:text-xs">
													{strategyKeepsCard(strategy, index)
														? translate($locale, 'highLow.keep')
														: translate($locale, 'highLow.replace')}
												</span>
											</div>
										{/each}
									</div>

									<div
										class="stats stats-vertical bg-base-200 sm:stats-horizontal w-full"
									>
										<div class="stat p-4">
											<div class="stat-title">
												{translate($locale, 'highLow.totalExpected')}
											</div>
											<div class="stat-value numeric text-2xl">
												{translate($locale, 'highLow.coins', {
													value: formatDecimal(
														$locale,
														strategy.expectedFinalPayout
													)
												})}
											</div>
											<div class="stat-desc mt-1 whitespace-normal">
												{translate($locale, 'highLow.totalExpectedHint')}
											</div>
										</div>
										<div class="stat p-4">
											<div class="stat-title">
												{translate($locale, 'highLow.hitRate')}
											</div>
											<div class="stat-value numeric text-2xl">
												{formatProbability(
													$locale,
													strategy.payoutHitProbability
												)}
											</div>
										</div>
									</div>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</div>

			{#if analysis && primaryStrategy}
				<details
					id="recommendation-breakdown"
					class="collapse-arrow bg-base-100 collapse shadow-sm"
				>
					<summary class="collapse-title text-lg font-semibold">
						{translate($locale, 'highLow.detailsHeading')}
					</summary>
					<div class="collapse-content space-y-6">
						{#each analysis.bestStrategies as strategy, index}
							<section
								class={`space-y-4 ${index > 0 ? 'border-base-300 border-t pt-6' : ''}`}
								aria-labelledby={`strategy-breakdown-heading-${strategy.holdMask}`}
							>
								<h3
									id={`strategy-breakdown-heading-${strategy.holdMask}`}
									class="font-semibold"
								>
									{strategyHeading($locale, strategy)}
								</h3>

								<div class="stats bg-base-200 w-full">
									<div class="stat p-4">
										<div class="stat-title">
											{translate($locale, 'highLow.pokerExpected')}
										</div>
										<div class="stat-value numeric text-2xl">
											{translate($locale, 'highLow.coins', {
												value: formatDecimal(
													$locale,
													strategy.expectedPokerPayout
												)
											})}
										</div>
									</div>
								</div>

								<section
									aria-labelledby={`distribution-heading-${strategy.holdMask}`}
								>
									<h4
										id={`distribution-heading-${strategy.holdMask}`}
										class="mb-2 font-semibold"
									>
										{translate($locale, 'highLow.distribution')}
									</h4>
									<div class="overflow-x-auto">
										<table class="table-sm table">
											<thead>
												<tr>
													<th scope="col">
														{translate($locale, 'highLow.handType')}
													</th>
													<th class="text-right" scope="col">
														{translate($locale, 'highLow.probability')}
													</th>
												</tr>
											</thead>
											<tbody>
												{#each HAND_RANKS as rank}
													{#if strategy.rankProbabilities[rank] > 0}
														<tr>
															<th scope="row">
																{translate($locale, handRankMessageKey(rank))}
															</th>
															<td class="numeric text-right">
																{formatProbability(
																	$locale,
																	strategy.rankProbabilities[rank]
																)}
															</td>
														</tr>
													{/if}
												{/each}
											</tbody>
										</table>
									</div>
								</section>
							</section>
						{/each}

						{#if alternativeStrategies.length > 0}
							<section aria-labelledby="alternatives-heading">
								<h3 id="alternatives-heading" class="mb-2 font-semibold">
									{translate($locale, 'highLow.alternatives')}
								</h3>
								<div class="grid gap-3 sm:grid-cols-2">
									{#each alternativeStrategies as strategy}
										<article class="bg-base-200 rounded-box p-4">
											<h4 class="font-semibold">
												{strategyHeading($locale, strategy)}
											</h4>
											<p class="mt-1 font-mono text-sm">
												{strategyCardList($locale, strategy)}
											</p>
											<p class="text-base-content/70 numeric mt-2 text-sm">
												{translate($locale, 'highLow.difference', {
													value: formatDecimal(
														$locale,
														primaryStrategy.expectedFinalPayout -
															strategy.expectedFinalPayout
													)
												})}
											</p>
										</article>
									{/each}
								</div>
							</section>
						{/if}
					</div>
				</details>
			{/if}

			<details
				id="calculation-method"
				class="collapse-arrow bg-base-100 collapse shadow-sm"
			>
				<summary class="collapse-title text-lg font-semibold">
					{translate($locale, 'highLow.methodHeading')}
				</summary>
				<div class="collapse-content">
					<div class="text-base-content/70 grid gap-2 text-sm">
						<p>{translate($locale, 'highLow.methodIntro')}</p>
						<p>{translate($locale, 'highLow.methodHighLow')}</p>
						<p>{translate($locale, 'highLow.methodLimit')}</p>
					</div>
				</div>
			</details>
		</section>
	</div>

	<section
		class="card bg-base-100 mt-6 shadow-sm"
		aria-labelledby="daily-route-heading"
	>
		<div class="card-body gap-5 p-5 sm:p-6">
			<div>
				<h2 id="daily-route-heading" class="card-title text-lg">
					{translate($locale, 'highLow.daily.heading')}
				</h2>
				<p class="text-base-content/70 mt-1 text-sm">
					{translate($locale, 'highLow.daily.summary')}
				</p>
			</div>

			<div
				class={`alert ${dailySubtotal >= DAILY_HIGH_LOW_TARGET ? 'alert-success' : dailySubtotal >= DAILY_HIGH_LOW_LIMIT ? 'alert-warning' : 'alert-info'}`}
				role="status"
				aria-live="polite"
			>
				<span
					>{dailyRecommendationText(
						$locale,
						dailyRecommendation,
						dailySubtotal
					)}</span
				>
			</div>

			<div
				class="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
			>
				<fieldset class="fieldset gap-1 p-0">
					<legend id="daily-hand-label" class="fieldset-legend p-0">
						{translate($locale, 'highLow.daily.handLabel')}
					</legend>
					<select
						id="daily-hand-rank"
						class="select w-full"
						value={selectedDailyRank ?? ''}
						aria-labelledby="daily-hand-label"
						disabled={dailySubtotal >= DAILY_HIGH_LOW_LIMIT}
						onchange={selectDailyRank}
					>
						<option value="">
							{translate($locale, 'highLow.daily.handPlaceholder')}
						</option>
						{#each PAYING_HAND_RANKS as rank}
							<option value={rank}>
								{translate($locale, handRankMessageKey(rank))}
							</option>
						{/each}
					</select>
				</fieldset>

				<fieldset class="fieldset gap-1 p-0">
					<legend id="daily-double-ups-label" class="fieldset-legend p-0">
						{translate($locale, 'highLow.daily.actualDoubleUpsLabel')}
					</legend>
					<select
						id="daily-double-ups"
						class="select w-full"
						value={selectedDailyDoubleUps ?? ''}
						aria-labelledby="daily-double-ups-label"
						disabled={!selectedDailyRank || dailyDoubleUpOptions.length === 0}
						onchange={selectDailyDoubleUps}
					>
						<option value="">
							{translate($locale, 'highLow.daily.actualDoubleUpsPlaceholder')}
						</option>
						{#each dailyDoubleUpOptions as option}
							<option value={option.successfulDoubleUps}>
								{translate($locale, 'highLow.daily.doubleUpsOption', {
									count: option.successfulDoubleUps
								})}{option.successfulDoubleUps ===
								dailyRecommendation?.recommended?.successfulDoubleUps
									? ` (${translate($locale, 'highLow.daily.recommended')})`
									: ''}{option.forced
									? ` (${translate($locale, 'highLow.daily.forced')})`
									: ''}
							</option>
						{/each}
					</select>
				</fieldset>

				<button
					id="daily-add-payout"
					class="btn btn-primary min-h-12"
					type="button"
					disabled={!selectedDailyRank || !selectedDailyOption}
					onclick={recordDailyPayout}
				>
					{translate($locale, 'highLow.daily.record')}
				</button>
			</div>

			{#if selectedDailyOption}
				<p class="numeric font-semibold">
					{translate($locale, 'highLow.daily.preview', {
						payout: formatInteger($locale, selectedDailyOption.payout),
						total: formatInteger($locale, selectedDailyOption.subtotalAfter)
					})}
				</p>
				{#if selectedDailyOption.status === 'blocked-below-target'}
					<div class="alert alert-warning py-3" role="alert">
						<span>{translate($locale, 'highLow.daily.blockedWarning')}</span>
					</div>
				{/if}
			{/if}

			<div
				class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
			>
				<p class="text-base-content/70 text-sm">
					{translate($locale, 'highLow.daily.failedHint')}
				</p>
				<button
					id="high-low-next-game"
					class="btn btn-outline min-h-12"
					type="button"
					disabled={completedCardCount === 0}
					onclick={startNextGame}
				>
					{translate($locale, 'highLow.daily.nextGame')}
				</button>
			</div>

			<section aria-labelledby="daily-history-heading">
				<div class="flex items-center justify-between gap-4">
					<h3 id="daily-history-heading" class="font-semibold">
						{translate($locale, 'highLow.daily.history')}
					</h3>
					<button
						id="daily-reset"
						class={`btn btn-sm ${dailyResetArmed ? 'btn-warning' : 'btn-ghost'}`}
						type="button"
						disabled={dailyProgress.entries.length === 0}
						onclick={handleDailyReset}
					>
						{translate(
							$locale,
							dailyResetArmed
								? 'highLow.daily.resetConfirm'
								: 'highLow.daily.reset'
						)}
					</button>
				</div>

				{#if dailyHistoryRows.length === 0}
					<p class="text-base-content/70 mt-2 text-sm">
						{translate($locale, 'highLow.daily.historyEmpty')}
					</p>
				{:else}
					<ul class="list bg-base-200 rounded-box mt-2">
						{#each dailyHistoryRows as row}
							<li class="list-row items-center">
								<div class="list-col-grow">
									<div class="font-medium">
										{#if row.entry.kind === 'cashout'}
											{translate($locale, 'highLow.daily.historyItem', {
												hand: translate(
													$locale,
													handRankMessageKey(row.entry.handRank)
												),
												count: row.entry.successfulDoubleUps
											})}
										{:else}
											{translate($locale, 'highLow.daily.importedHistoryItem')}
										{/if}
									</div>
									<div class="text-base-content/70 numeric text-sm">
										{translate($locale, 'highLow.coins', {
											value: formatInteger($locale, row.payout)
										})}
									</div>
								</div>
								<button
									class="btn btn-ghost btn-sm"
									type="button"
									onclick={() => removeDailyPayout(row.index)}
								>
									{translate($locale, 'highLow.daily.remove')}
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<div class="text-base-content/70 grid gap-1 text-xs">
				<p>{translate($locale, 'highLow.daily.pastHint')}</p>
				<p>{translate($locale, 'highLow.daily.resetNote')}</p>
				<p>{translate($locale, 'highLow.daily.methodNote')}</p>
			</div>

			{#if dailyStorageError}
				<div class="alert alert-warning py-3" role="alert">
					<span>{translate($locale, 'highLow.daily.storageError')}</span>
				</div>
			{/if}
		</div>
	</section>

	<ToolShare
		activeLocale={$locale}
		path="/holodori/high-low/"
		title={translate($locale, 'home.highLowTitle')}
		description={translate($locale, 'highLow.description')}
		hashtag={translate($locale, 'holodori.hashtag')}
	/>

	<footer class="text-base-content/60 mt-6 text-center text-xs">
		{translate($locale, 'holodori.unofficial')}
	</footer>
</div>
