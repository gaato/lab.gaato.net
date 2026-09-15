import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export function listRoutes(rootDir = 'src/routes') {
	const routes = [];

	function scan(directory, segments) {
		for (const entry of readdirSync(directory, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				if (entry.name.startsWith('[')) {
					throw new Error(
						`Dynamic route directories are not supported: ${join(directory, entry.name)}`
					);
				}

				scan(
					join(directory, entry.name),
					entry.name.startsWith('(') ? segments : [...segments, entry.name]
				);
			} else if (entry.isFile() && entry.name === '+page.svelte') {
				routes.push(segments.length === 0 ? '/' : `/${segments.join('/')}/`);
			}
		}
	}

	scan(rootDir, []);
	return routes.sort();
}

export function routeHtmlFiles(rootDir = 'src/routes') {
	return [
		'404.html',
		...listRoutes(rootDir).map((route) =>
			route === '/' ? 'index.html' : `${route.slice(1)}index.html`
		)
	].sort();
}
