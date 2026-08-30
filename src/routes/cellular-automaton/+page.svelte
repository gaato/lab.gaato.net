<script lang="ts">
	import AutomatonLab from '$lib/AutomatonLab.svelte';
	import ToolShare from '$lib/ToolShare.svelte';
	import { locale, translate } from '$lib/i18n';
</script>

<svelte:head>
	<title>{translate($locale, 'automaton.title')}</title>
	<meta
		name="description"
		content={translate($locale, 'automaton.description')}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="lab.gaato.net" />
	<meta property="og:title" content={translate($locale, 'automaton.title')} />
	<meta
		property="og:description"
		content={translate($locale, 'automaton.description')}
	/>
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="mx-auto w-full max-w-5xl px-4 py-8 sm:py-12">
	<nav
		class="breadcrumbs mb-2 text-sm"
		aria-label={translate($locale, 'site.breadcrumbs')}
	>
		<ul>
			<li><a href="/?lang={$locale}">{translate($locale, 'site.home')}</a></li>
			<li>{translate($locale, 'automaton.heading')}</li>
		</ul>
	</nav>

	<h1 class="text-2xl font-bold">{translate($locale, 'automaton.heading')}</h1>
	<p class="text-base-content/70 mt-2 mb-6 max-w-3xl">
		{translate($locale, 'automaton.summary')}
	</p>

	<AutomatonLab />

	<ToolShare
		activeLocale={$locale}
		path="/cellular-automaton/"
		title={translate($locale, 'automaton.heading')}
		description={translate($locale, 'automaton.description')}
	/>
</div>
