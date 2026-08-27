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

<section
	class="grid min-h-[70dvh] place-items-center px-6 py-16"
	aria-labelledby="error-heading"
>
	<div
		class="card bg-base-100 border-base-300 w-full max-w-xl border shadow-sm"
	>
		<div class="card-body gap-5">
			<p class="text-primary font-mono text-sm font-bold tracking-[0.18em]">
				{page.status}
			</p>
			<h1 id="error-heading" class="card-title text-3xl sm:text-4xl">
				{translate(
					activeLocale,
					isNotFound ? 'error.notFoundHeading' : 'error.genericHeading'
				)}
			</h1>
			<p class="text-base-content/70 text-lg">
				{translate(
					activeLocale,
					isNotFound ? 'error.notFoundBody' : 'error.genericBody'
				)}
			</p>
			<div class="card-actions mt-3">
				<a class="btn btn-primary min-h-12" href={`/?lang=${activeLocale}`}
					>{translate(activeLocale, 'error.backHome')}</a
				>
			</div>
		</div>
	</div>
</section>
