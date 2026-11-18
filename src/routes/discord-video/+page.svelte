<script lang="ts">
	import ToolShare from '#lib/ToolShare.svelte';
	import VideoCompressor from '#lib/VideoCompressor.svelte';
	import { locale, translate } from '#lib/i18n.ts';
</script>

<svelte:head>
	<title>{translate($locale, 'discordVideo.title')}</title>
	<meta
		name="description"
		content={translate($locale, 'discordVideo.description')}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="lab.gaato.net" />
	<meta
		property="og:title"
		content={translate($locale, 'discordVideo.title')}
	/>
	<meta
		property="og:description"
		content={translate($locale, 'discordVideo.description')}
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
			<li>{translate($locale, 'discordVideo.heading')}</li>
		</ul>
	</nav>

	<h1 class="text-2xl font-bold">
		{translate($locale, 'discordVideo.heading')}
	</h1>
	<p class="text-base-content/70 mt-2 max-w-3xl">
		{translate($locale, 'discordVideo.summary')}
	</p>
	<p class="text-base-content/60 mt-2 mb-6 max-w-3xl text-sm">
		{translate($locale, 'discordVideo.unofficial')}
	</p>

	<VideoCompressor />

	<ToolShare
		activeLocale={$locale}
		path="/discord-video/"
		title={translate($locale, 'discordVideo.heading')}
		description={translate($locale, 'discordVideo.description')}
	/>
</div>
