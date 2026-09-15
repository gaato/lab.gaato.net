<script lang="ts">
	import JellyGifStudio from '$lib/JellyGifStudio.svelte';
	import ToolShare from '$lib/ToolShare.svelte';
	import { locale, translate } from '$lib/i18n';
</script>

<svelte:head>
	<title>{translate($locale, 'jellyGif.title')}</title>
	<meta
		name="description"
		content={translate($locale, 'jellyGif.description')}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="lab.gaato.net" />
	<meta property="og:title" content={translate($locale, 'jellyGif.title')} />
	<meta
		property="og:description"
		content={translate($locale, 'jellyGif.description')}
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
			<li>{translate($locale, 'jellyGif.heading')}</li>
		</ul>
	</nav>

	<h1 class="text-2xl font-bold">{translate($locale, 'jellyGif.heading')}</h1>
	<p class="text-base-content/70 mt-2 mb-6 max-w-3xl">
		{translate($locale, 'jellyGif.summary')}
	</p>

	<JellyGifStudio />

	<ToolShare
		activeLocale={$locale}
		path="/jelly-gif/"
		title={translate($locale, 'jellyGif.heading')}
		description={translate($locale, 'jellyGif.description')}
	/>
</div>
