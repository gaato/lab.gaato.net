<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { onMount } from 'svelte';
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
	type Theme = 'light' | 'dark';
	type ThemePreference = Theme | 'system';
	const themeStorageKey = 'lab.gaato.net.theme';
	let themePreference: ThemePreference = $state('system');
	let systemTheme: Theme = $state('light');

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

	function readStoredTheme(): ThemePreference {
		try {
			const stored = localStorage.getItem(themeStorageKey);
			return stored === 'light' || stored === 'dark' ? stored : 'system';
		} catch {
			return 'system';
		}
	}

	function persistTheme(nextTheme: ThemePreference): void {
		try {
			if (nextTheme === 'system') {
				localStorage.removeItem(themeStorageKey);
			} else {
				localStorage.setItem(themeStorageKey, nextTheme);
			}
		} catch {
			// A blocked storage area should not prevent theme switching.
		}
	}

	function applyTheme(nextTheme: ThemePreference): void {
		themePreference = nextTheme;
		const colorScheme = document.querySelector<HTMLMetaElement>(
			'meta[name="color-scheme"]'
		);
		if (nextTheme === 'system') {
			delete document.documentElement.dataset.theme;
			colorScheme?.setAttribute('content', 'light dark');
		} else {
			document.documentElement.dataset.theme = nextTheme;
			colorScheme?.setAttribute('content', nextTheme);
		}
	}

	function toggleTheme(): void {
		const nextTheme: ThemePreference =
			themePreference === 'system'
				? systemTheme === 'dark'
					? 'light'
					: 'dark'
				: 'system';
		persistTheme(nextTheme);
		applyTheme(nextTheme);
	}

	function themeButtonLabel(activeLocale: Locale): string {
		if (themePreference !== 'system') {
			return translate(activeLocale, 'site.themeUseSystem');
		}
		return systemTheme === 'dark'
			? translate(activeLocale, 'site.themeUseLight')
			: translate(activeLocale, 'site.themeUseDark');
	}

	onMount(() => {
		const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
		const updateSystemTheme = (): void => {
			systemTheme = darkMode.matches ? 'dark' : 'light';
		};
		updateSystemTheme();
		applyTheme(readStoredTheme());
		darkMode.addEventListener('change', updateSystemTheme);
		return () => darkMode.removeEventListener('change', updateSystemTheme);
	});

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
			<div class="min-w-0 flex-1">
				<a
					class="btn btn-ghost max-w-full truncate px-2 text-lg font-semibold"
					href="/?lang={$locale}"
				>
					{translate($locale, 'site.name')}
				</a>
			</div>

			<div class="flex flex-none items-center gap-1">
				<button
					id="site-theme"
					type="button"
					class="btn btn-ghost btn-square btn-sm"
					aria-label={themeButtonLabel($locale)}
					aria-pressed={themePreference !== 'system'}
					onclick={toggleTheme}
				>
					{#if themePreference !== 'system'}
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="size-5"
						>
							<rect x="3" y="4" width="18" height="12" rx="2" />
							<path d="M8 20h8M12 16v4" />
						</svg>
					{:else if systemTheme === 'dark'}
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="size-5"
						>
							<circle cx="12" cy="12" r="4" />
							<path
								d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"
							/>
						</svg>
					{:else}
						<svg
							aria-hidden="true"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="size-5"
						>
							<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
						</svg>
					{/if}
				</button>

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

	<footer
		class="footer footer-center border-base-300 border-t px-4 py-5 text-sm"
	>
		<nav
			class="flex flex-wrap justify-center gap-x-4 gap-y-2"
			aria-label={translate($locale, 'site.footerLinks')}
		>
			<a class="link link-hover" href="https://github.com/gaato/lab.gaato.net">
				{translate($locale, 'site.source')}
			</a>
			<a
				class="link link-hover"
				href="https://blueoakcouncil.org/license/1.0.0"
			>
				{translate($locale, 'site.license')}
			</a>
			<a class="link link-hover" href="/THIRD_PARTY_NOTICES.txt">
				{translate($locale, 'site.thirdPartyNotices')}
			</a>
			<a class="link link-hover" href="https://gaato.net">
				{translate($locale, 'site.developer')}
			</a>
		</nav>
	</footer>
</div>
