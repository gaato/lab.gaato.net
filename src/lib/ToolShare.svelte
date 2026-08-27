<script lang="ts">
	import { translate, type Locale, type MessageKey } from '$lib/i18n';

	type Props = {
		activeLocale: Locale;
		path: string;
		title: string;
		description: string;
	};

	let { activeLocale, path, title, description }: Props = $props();
	let status: MessageKey | null = $state(null);

	function toolUrl(): string {
		const url = new URL(path, window.location.origin);
		url.searchParams.set('lang', activeLocale);
		return url.toString();
	}

	async function copyUrl(url: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(url);
			status = 'site.shareCopied';
		} catch {
			status = 'site.shareFailed';
		}
	}

	async function shareTool(): Promise<void> {
		status = null;
		const url = toolUrl();

		if (typeof navigator.share === 'function') {
			try {
				await navigator.share({ title, text: description, url });
				return;
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError')
					return;
			}
		}

		await copyUrl(url);
	}
</script>

<div class="mt-6 text-center">
	<button class="btn btn-outline" type="button" onclick={shareTool}>
		{translate(activeLocale, 'site.shareTool')}
	</button>
	{#if status}
		<p class="text-base-content/70 mt-2 text-sm" role="status">
			{translate(activeLocale, status)}
		</p>
	{/if}
</div>
