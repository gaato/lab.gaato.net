/** Mounts the tasuki share button into the element with `containerId`. The
 * page provides `globalThis.tasukiHost.share(url)`, which resolves to
 * "shared", "copied" or "dismissed", or rejects. Empty classes mean none. */
export function mount_share(
	containerId: string,
	url: string,
	label: string,
	copied: string,
	failed: string,
	buttonClass: string,
	saidClass: string
): void;
