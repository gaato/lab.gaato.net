<script lang="ts">
	import { locale, translate } from '$lib/i18n';
</script>

<svelte:head>
	<title>{translate($locale, 'home.title')}</title>
	<meta name="description" content={translate($locale, 'home.description')} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="gaato lab" />
	<meta property="og:title" content={translate($locale, 'home.title')} />
	<meta
		property="og:description"
		content={translate($locale, 'home.description')}
	/>
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div
	class="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20"
>
	<section
		class="grid items-end gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.65fr)] lg:gap-16"
	>
		<div class="max-w-3xl">
			<p class="text-primary mb-4 text-xs font-black tracking-[0.2em]">
				{translate($locale, 'home.kicker')}
			</p>
			<h1
				class="text-base-content max-w-3xl text-4xl leading-[1.05] font-black tracking-[-0.055em] sm:text-5xl lg:text-6xl"
			>
				{translate($locale, 'home.heading')}
			</h1>
			<p
				class="text-base-content/72 mt-6 max-w-2xl text-base leading-relaxed sm:text-lg"
			>
				{translate($locale, 'home.lead')}
			</p>
		</div>

		<div
			class="border-primary bg-primary text-primary-content rounded-box border p-6 sm:p-8"
		>
			<p class="numeric text-sm font-bold tracking-[0.12em]">LAB.GAATO.NET</p>
			<p
				class="numeric mt-8 text-5xl font-black tracking-[-0.06em] sm:text-6xl"
			>
				Pt = ?
			</p>
		</div>
	</section>

	<section class="mt-16 sm:mt-24" aria-labelledby="tool-collection-heading">
		<details
			class="border-base-300 bg-base-100 rounded-box collapse border"
			open
		>
			<summary class="collapse-title min-h-16 px-5 py-5 sm:px-7">
				<span
					id="tool-collection-heading"
					class="block text-xl font-black tracking-[-0.03em] sm:text-2xl"
				>
					{translate($locale, 'home.collection')}
				</span>
				<span class="text-base-content/65 mt-1 block text-sm font-normal">
					{translate($locale, 'home.collectionHint')}
				</span>
			</summary>

			<div class="collapse-content px-5 pb-5 sm:px-7 sm:pb-7">
				<a
					class="group border-base-300 bg-base-200 hover:border-primary focus-visible:border-primary rounded-box grid min-h-48 border p-5 transition-colors sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8 sm:p-7"
					href="/event-point/?lang={$locale}"
				>
					<div>
						<h2
							class="group-hover:text-primary text-2xl font-black tracking-[-0.04em] transition-colors sm:text-3xl"
						>
							{translate($locale, 'home.eventPointTitle')}
						</h2>
						<p class="text-base-content/72 mt-3 max-w-2xl leading-relaxed">
							{translate($locale, 'home.eventPointDescription')}
						</p>
					</div>
					<span class="btn btn-primary mt-6 min-w-40 whitespace-nowrap sm:mt-0">
						{translate($locale, 'home.openTool')}
					</span>
				</a>
			</div>
		</details>
	</section>
</div>
