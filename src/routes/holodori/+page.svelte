<script lang="ts">
	import { locale, translate } from '$lib/i18n';
</script>

<svelte:head>
	<title>{translate($locale, 'holodori.title')}</title>
	<meta
		name="description"
		content={translate($locale, 'holodori.description')}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="lab.gaato.net" />
	<meta property="og:title" content={translate($locale, 'holodori.title')} />
	<meta
		property="og:description"
		content={translate($locale, 'holodori.description')}
	/>
	<meta name="twitter:card" content="summary" />
</svelte:head>

<div class="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
	<nav
		class="breadcrumbs mb-2 text-sm"
		aria-label={translate($locale, 'site.breadcrumbs')}
	>
		<ul>
			<li><a href="/?lang={$locale}">{translate($locale, 'site.home')}</a></li>
			<li>{translate($locale, 'site.holodori')}</li>
		</ul>
	</nav>

	<h1 class="mb-4 text-2xl font-bold">
		{translate($locale, 'holodori.collection')}
	</h1>
	<ul class="menu bg-base-100 rounded-box w-full shadow-sm" role="list">
		<li>
			<a class="py-4 text-base" href="/holodori/event-pt/?lang={$locale}">
				{translate($locale, 'holodori.eventPointTitle')}
			</a>
		</li>
		<li>
			<a class="py-4 text-base" href="/holodori/high-low/?lang={$locale}">
				{translate($locale, 'holodori.highLowTitle')}
			</a>
		</li>
	</ul>

	<footer class="text-base-content/60 mt-6 text-center text-xs">
		{translate($locale, 'holodori.unofficial')}
	</footer>
</div>
