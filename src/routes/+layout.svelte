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
	<header class="border-base-300 bg-base-100 border-b">
		<div class="navbar mx-auto w-full max-w-5xl px-4">
			<div class="flex-1">
				<a
					class="btn btn-ghost px-2 text-lg font-semibold"
					href="/?lang={$locale}"
				>
					{translate($locale, 'site.name')}
				</a>
			</div>

			<div class="flex-none">
				<label class="sr-only" for="site-language"
					>{translate($locale, 'site.language')}</label
				>
				<select
					id="site-language"
					class="select select-bordered min-w-32"
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
</div>
