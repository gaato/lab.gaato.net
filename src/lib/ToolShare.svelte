<script lang="ts">
	import { translate, type Locale } from '#lib/i18n.ts';
	// The button itself is a tasuki component (see src/lib/tasuki/README.md).
	import { mount_share } from '#lib/tasuki/share.js';

	type Props = {
		activeLocale: Locale;
		path: string;
		title: string;
		description: string;
		hashtag?: string;
	};

	let { activeLocale, path, title, description, hashtag }: Props = $props();
	const containerId = 'tool-share';
	let container: HTMLDivElement | undefined = $state();

	type Host = { share?: (url: string) => Promise<string> };

	$effect(() => {
		if (!container) return;
		const url = new URL(path, window.location.origin);
		url.searchParams.set('lang', activeLocale);
		const text = hashtag ? `${description} ${hashtag}` : description;
		const host = ((globalThis as { tasukiHost?: Host }).tasukiHost ??= {});
		// Resolves to what happened; the component announces it.
		host.share = async (shared: string) => {
			if (typeof navigator.share === 'function') {
				try {
					await navigator.share({ title, text, url: shared });
					return 'shared';
				} catch (error) {
					if (error instanceof DOMException && error.name === 'AbortError')
						return 'dismissed';
				}
			}
			await navigator.clipboard.writeText(shared);
			return 'copied';
		};
		// Mount afresh when the language or the page changes.
		container.replaceChildren();
		mount_share(
			containerId,
			url.toString(),
			translate(activeLocale, 'site.shareTool'),
			translate(activeLocale, 'site.shareCopied'),
			translate(activeLocale, 'site.shareFailed'),
			'btn btn-outline',
			'text-base-content/70 mt-2 text-sm'
		);
	});
</script>

<div class="mt-6 text-center" id={containerId} bind:this={container}></div>
