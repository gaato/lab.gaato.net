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

<div class="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
	<h1 class="mb-4 text-2xl font-bold">
		{translate($locale, 'home.collection')}
	</h1>
	<ul class="menu bg-base-100 rounded-box w-full shadow-sm">
		<li>
			<a class="py-4 text-base" href="/event-point/?lang={$locale}">
				{translate($locale, 'home.eventPointTitle')}
			</a>
		</li>
	</ul>
</div>
