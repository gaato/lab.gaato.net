<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import {
		defaultLocale,
		locale,
		localeStorageKey,
		resolveLocale,
		supportedLocales,
		translate,
		type Locale
	} from '$lib/i18n';
	import './layout.css';

	let { children } = $props();
	let selectedLocale: Locale = $state(defaultLocale);

	function readStoredLocale(): string | null {
		try {
			return localStorage.getItem(localeStorageKey);
		} catch {
			return null;
		}
	}

	function persistLocale(nextLocale: Locale): void {
		try {
			localStorage.setItem(localeStorageKey, nextLocale);
		} catch {
			// A blocked storage area should not prevent language switching.
		}
	}

	function applyLocale(nextLocale: Locale): void {
		selectedLocale = nextLocale;
		locale.set(nextLocale);
		document.documentElement.lang = nextLocale;
	}

	afterNavigate(({ to }) => {
		if (!to) return;
		const nextLocale = resolveLocale(
			to.url.searchParams.get('lang'),
			readStoredLocale(),
			navigator.languages?.length ? navigator.languages : [navigator.language]
		);
		applyLocale(nextLocale);
	});

	async function changeLanguage(event: Event): Promise<void> {
		const nextLocale = (event.currentTarget as HTMLSelectElement)
			.value as Locale;
		const url = new URL(window.location.href);
		url.searchParams.set('lang', nextLocale);
		persistLocale(nextLocale);
		applyLocale(nextLocale);
		await goto(`${url.pathname}${url.search}${url.hash}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
	}
</script>

<div class="flex min-h-[100dvh] flex-col">
	<header class="border-base-300 bg-base-100/94 border-b backdrop-blur-sm">
		<div
			class="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
		>
			<a
				class="text-base-content hover:text-primary inline-flex min-h-12 items-center text-lg font-black tracking-[-0.04em] transition-colors"
				href="/?lang={$locale}"
			>
				{translate($locale, 'site.name')}
			</a>

			<div class="flex items-center gap-2">
				<label class="sr-only" for="site-language"
					>{translate($locale, 'site.language')}</label
				>
				<select
					id="site-language"
					class="select select-sm border-base-300 bg-base-100 min-h-12 min-w-32 font-semibold"
					value={selectedLocale}
					onchange={changeLanguage}
				>
					{#each supportedLocales as option}
						<option value={option}
							>{translate($locale, `language.${option}`)}</option
						>
					{/each}
				</select>
			</div>
		</div>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="border-base-300 border-t">
		<div
			class="text-base-content/70 mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-8 text-sm sm:px-6 lg:px-8"
		>
			<strong class="text-base-content font-bold"
				>{translate($locale, 'site.name')}</strong
			>
			<p class="max-w-3xl leading-relaxed">
				{translate($locale, 'site.unofficial')}
			</p>
		</div>
	</footer>
</div>
