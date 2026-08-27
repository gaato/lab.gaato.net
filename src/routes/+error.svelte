<script lang="ts">
	import { page } from '$app/state';
	import { isLocale, locale, translate } from '$lib/i18n';

	const isNotFound = $derived(page.status === 404);
	const queryLocale = $derived(page.url.searchParams.get('lang'));
	const activeLocale = $derived(isLocale(queryLocale) ? queryLocale : $locale);
</script>

<svelte:head>
	<title
		>{translate(
			activeLocale,
			isNotFound ? 'error.notFoundTitle' : 'error.genericTitle'
		)}</title
	>
	<meta
		name="description"
		content={translate(
			activeLocale,
			isNotFound ? 'error.notFoundDescription' : 'error.genericDescription'
		)}
	/>
</svelte:head>

<section class="hero min-h-[70dvh]" aria-labelledby="error-heading">
	<div class="hero-content px-6 py-16 text-center">
		<div class="max-w-md">
			<p class="text-base-content/60 text-sm font-semibold">{page.status}</p>
			<h1 id="error-heading" class="mt-2 text-3xl font-bold">
				{translate(
					activeLocale,
					isNotFound ? 'error.notFoundHeading' : 'error.genericHeading'
				)}
			</h1>
			<p class="text-base-content/70 mt-4">
				{translate(
					activeLocale,
					isNotFound ? 'error.notFoundBody' : 'error.genericBody'
				)}
			</p>
			<a class="btn btn-primary mt-6" href={`/?lang=${activeLocale}`}
				>{translate(activeLocale, 'error.backHome')}</a
			>
		</div>
	</div>
</section>
