<script lang="ts">
	import { onDestroy } from 'svelte';
	import AnalysisWorker from '$lib/high-low.worker?worker';
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
	import type {
		HighLowWorkerRequest,
		HighLowWorkerResponse
	} from '$lib/high-low-worker';
	import { locale, translate, type Locale, type MessageKey } from '$lib/i18n';

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

	onDestroy(stopWorker);
</script>

<svelte:head>
	<title>{translate($locale, 'highLow.title')}</title>
	<meta
		name="description"
		content={translate($locale, 'highLow.description')}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="gaato lab" />
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
		</section>
	</div>

	{#if analysis && primaryStrategy}
		<details class="collapse-arrow bg-base-100 collapse mt-6 shadow-sm">
			<summary class="collapse-title text-lg font-semibold">
				{translate($locale, 'highLow.detailsHeading')}
			</summary>
			<div class="collapse-content space-y-6">
				<div class="stats bg-base-200 w-full">
					<div class="stat p-4">
						<div class="stat-title">
							{translate($locale, 'highLow.pokerExpected')}
						</div>
						<div class="stat-value numeric text-2xl">
							{translate($locale, 'highLow.coins', {
								value: formatDecimal(
									$locale,
									primaryStrategy.expectedPokerPayout
								)
							})}
						</div>
					</div>
				</div>

				<section aria-labelledby="distribution-heading">
					<h3 id="distribution-heading" class="mb-2 font-semibold">
						{translate($locale, 'highLow.distribution')}
					</h3>
					<div class="overflow-x-auto">
						<table class="table-sm table">
							<thead>
								<tr>
									<th scope="col">{translate($locale, 'highLow.handType')}</th>
									<th class="text-right" scope="col">
										{translate($locale, 'highLow.probability')}
									</th>
								</tr>
							</thead>
							<tbody>
								{#each HAND_RANKS as rank}
									{#if primaryStrategy.rankProbabilities[rank] > 0}
										<tr>
											<th scope="row">
												{translate($locale, handRankMessageKey(rank))}
											</th>
											<td class="numeric text-right">
												{formatProbability(
													$locale,
													primaryStrategy.rankProbabilities[rank]
												)}
											</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
				</section>

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

	<details class="collapse-arrow bg-base-100 collapse mt-6 shadow-sm">
		<summary class="collapse-title text-lg font-semibold">
			{translate($locale, 'highLow.methodHeading')}
		</summary>
		<div class="collapse-content">
			<div class="text-base-content/70 grid gap-2 text-sm">
				<p>{translate($locale, 'highLow.methodIntro')}</p>
				<p>{translate($locale, 'highLow.methodHighLow')}</p>
				<p>{translate($locale, 'highLow.methodLimit')}</p>
				<p>{translate($locale, 'highLow.methodVersion')}</p>
			</div>
			<a
				class="link link-primary mt-4 inline-block"
				href="https://store.steampowered.com/news/app/4282500/view/683009119697764518"
				target="_blank"
				rel="noreferrer"
			>
				{translate($locale, 'highLow.source')}
			</a>
		</div>
	</details>

	<footer class="text-base-content/60 mt-6 text-center text-xs">
		{translate($locale, 'holodori.unofficial')}
	</footer>
</div>
