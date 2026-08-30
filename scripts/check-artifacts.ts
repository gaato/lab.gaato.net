import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, posix, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const outputDirectory = resolve('build');
const canonicalOrigin = 'https://lab.gaato.net';
const expectedHtml = [
	'404.html',
	'cellular-automaton/index.html',
	'holodori/event-pt/index.html',
	'holodori/high-low/index.html',
	'holodori/index.html',
	'index.html'
].sort();
const failures: string[] = [];

function fail(message: string): void {
	failures.push(message);
}

async function walk(directory: string, prefix = ''): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	const files: string[] = [];
	for (const entry of entries) {
		const relative = posix.join(prefix, entry.name);
		if (entry.isDirectory())
			files.push(...(await walk(resolve(directory, entry.name), relative)));
		else if (entry.isFile()) files.push(relative);
	}
	return files;
}

async function readOutput(relative: string): Promise<string> {
	return readFile(resolve(outputDirectory, relative), 'utf8');
}

function resolveAsset(reference: string, from: string): string | undefined {
	if (/^(?:data:|blob:|mailto:|tel:|#)/iu.test(reference)) return undefined;
	const url = new URL(reference, `${canonicalOrigin}/${from}`);
	if (url.origin !== canonicalOrigin) return undefined;
	const relative = posix.normalize(
		decodeURIComponent(url.pathname).replace(/^\/+/, '')
	);
	if (relative === '..' || relative.startsWith('../')) {
		fail(`Asset reference escapes build: ${reference} from ${from}`);
		return undefined;
	}
	return relative;
}

function htmlAssetReferences(
	html: string,
	from: string,
	extension: '.js' | '.css'
): string[] {
	const references: string[] = [];
	const pattern = /\b(?:src|href)\s*=\s*(?:"([^"]+)"|'([^']+)')/giu;
	for (const match of html.matchAll(pattern)) {
		const reference = (match[1] ?? match[2]).split(/[?#]/u, 1)[0];
		if (reference.endsWith(extension)) {
			const resolved = resolveAsset(reference, from);
			if (resolved) references.push(resolved);
		}
	}
	return references;
}

function moduleReferences(source: string, from: string): string[] {
	const references: string[] = [];
	const pattern =
		/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']([^"']+\.js(?:[?#][^"']*)?)["']/gu;
	for (const match of source.matchAll(pattern)) {
		const resolved = resolveAsset(match[1], from);
		if (resolved) references.push(resolved);
	}
	return references;
}

function cssReferences(source: string, from: string): string[] {
	const references: string[] = [];
	const pattern =
		/@import\s+(?:url\(\s*)?["']([^"']+\.css(?:[?#][^"']*)?)["']/gu;
	for (const match of source.matchAll(pattern)) {
		const resolved = resolveAsset(match[1], from);
		if (resolved) references.push(resolved);
	}
	return references;
}

function inlineBlocks(html: string, element: 'script' | 'style'): string[] {
	return [
		...html.matchAll(
			new RegExp(`<${element}\\b([^>]*)>([\\s\\S]*?)<\\/${element}>`, 'giu')
		)
	]
		.filter((match) => element === 'style' || !/\bsrc\s*=/iu.test(match[1]))
		.map((match) => match[2]);
}

async function routeAssetSize(
	htmlFile: string,
	type: 'js' | 'css'
): Promise<{ bytes: number; files: string[] }> {
	const html = await readOutput(htmlFile);
	const visited = new Set<string>();
	let bytes = 0;

	async function include(relative: string): Promise<void> {
		if (visited.has(relative)) return;
		visited.add(relative);
		let source: Buffer;
		try {
			source = await readFile(resolve(outputDirectory, relative));
		} catch {
			fail(`${htmlFile} references missing asset ${relative}`);
			return;
		}
		bytes += gzipSync(source, { level: 9 }).byteLength;
		const text = source.toString('utf8');
		const nested =
			type === 'js'
				? moduleReferences(text, relative)
				: cssReferences(text, relative);
		for (const reference of nested) await include(reference);
	}

	const extension = type === 'js' ? '.js' : '.css';
	for (const reference of htmlAssetReferences(html, htmlFile, extension))
		await include(reference);
	for (const inline of inlineBlocks(html, type === 'js' ? 'script' : 'style')) {
		bytes += gzipSync(Buffer.from(inline), { level: 9 }).byteLength;
		if (type === 'js') {
			for (const reference of moduleReferences(inline, htmlFile))
				await include(reference);
		}
	}

	return { bytes, files: [...visited].sort() };
}

let files: string[] = [];
try {
	files = (await walk(outputDirectory)).sort();
} catch (error) {
	throw new Error(
		`Cannot inspect build. Run the production build first. ${String(error)}`
	);
}

const actualHtml = files.filter((file) => extname(file) === '.html').sort();
if (JSON.stringify(actualHtml) !== JSON.stringify(expectedHtml)) {
	fail(
		`Unexpected HTML outputs. Expected ${expectedHtml.join(', ')}; got ${actualHtml.join(', ')}`
	);
}

for (const required of [
	'THIRD_PARTY_NOTICES.txt',
	'_redirects',
	'favicon.svg'
]) {
	if (!files.includes(required)) fail(`Missing required output: ${required}`);
}

for (const file of files) {
	if (
		['.map', '.mbt', '.md', '.svelte', '.ts', '.wasm'].includes(extname(file))
	) {
		fail(`Source/runtime artifact must not ship: ${file}`);
	}
}

if (files.includes('404.html')) {
	const notFound = await readOutput('404.html');
	if (
		!/<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*\bnoindex\b/iu.test(
			notFound
		)
	) {
		fail('404.html is missing robots noindex metadata');
	}
}

if (files.includes('THIRD_PARTY_NOTICES.txt')) {
	const [sourceNotices, builtNotices] = await Promise.all([
		readFile(resolve('static/THIRD_PARTY_NOTICES.txt'), 'utf8'),
		readOutput('THIRD_PARTY_NOTICES.txt')
	]);
	if (sourceNotices !== builtNotices) {
		fail(
			'Built third-party notices differ from static/THIRD_PARTY_NOTICES.txt'
		);
	}
}

const routeCssBudget = 20 * 1024;
const routeJsBudgets = new Map<string, number>([
	['index.html', 50 * 1024],
	['cellular-automaton/index.html', 65 * 1024],
	['holodori/index.html', 50 * 1024],
	['holodori/event-pt/index.html', 80 * 1024],
	['holodori/high-low/index.html', 90 * 1024]
]);

for (const file of expectedHtml.filter(
	(candidate) => candidate !== '404.html'
)) {
	if (!files.includes(file)) continue;
	const css = await routeAssetSize(file, 'css');
	console.log(
		`${file}: ${css.bytes} bytes gzip CSS (${css.files.length} files)`
	);
	if (css.bytes > routeCssBudget) {
		fail(`${file} CSS is ${css.bytes} gzip bytes; budget is ${routeCssBudget}`);
	}

	const js = await routeAssetSize(file, 'js');
	const jsBudget = routeJsBudgets.get(file);
	console.log(
		`${file}: ${js.bytes} bytes gzip JavaScript (${js.files.length} files)`
	);
	if (jsBudget !== undefined && js.bytes > jsBudget) {
		fail(`${file} JavaScript is ${js.bytes} gzip bytes; budget is ${jsBudget}`);
	}
}

const outputSize = (
	await Promise.all(
		files.map(async (file) => (await stat(resolve(outputDirectory, file))).size)
	)
).reduce((total, size) => total + size, 0);
console.log(`Checked ${files.length} files (${outputSize} bytes total)`);

if (failures.length > 0) {
	for (const failure of failures) console.error(`- ${failure}`);
	throw new Error(
		`Production artifact check failed with ${failures.length} problem${failures.length === 1 ? '' : 's'}`
	);
}

console.log('Production artifact checks passed');
