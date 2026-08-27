const baseUrl = new URL(process.env.SITE_URL ?? 'http://127.0.0.1:4173');

const checks = [
	{ path: '/', status: 200, expectedText: 'gaato lab' },
	{
		path: '/event-point/?current=1144899&target=1145141&bonus=20&passport=1&lang=ja',
		status: 200,
		expectedText: 'イベントPtをぴったり合わせる'
	},
	{
		path: '/this-lab-route-does-not-exist/',
		status: 404,
		expectedText: 'Page not found'
	}
];

const failures = [];

for (const check of checks) {
	const url = new URL(check.path, baseUrl);
	let response;

	try {
		response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
	} catch (error) {
		failures.push(`${url.pathname}: request failed: ${error.message}`);
		continue;
	}

	const contentType = response.headers.get('content-type') ?? '';
	const body = await response.text();
	const hasDocument =
		/<!doctype html>/i.test(body) && /<html(?:\s|>)/i.test(body);
	const hasHeading = /<h1(?:\s|>)/i.test(body);

	if (response.status !== check.status) {
		failures.push(
			`${url.pathname}: expected HTTP ${check.status}, got ${response.status}`
		);
	}
	if (!contentType.toLowerCase().includes('text/html')) {
		failures.push(
			`${url.pathname}: expected HTML, got ${contentType || 'no content type'}`
		);
	}
	if (!hasDocument)
		failures.push(`${url.pathname}: response is not a complete HTML document`);
	if (!hasHeading) failures.push(`${url.pathname}: response has no h1`);
	if (!body.includes(check.expectedText)) {
		failures.push(
			`${url.pathname}: response does not contain ${JSON.stringify(check.expectedText)}`
		);
	}

	console.log(`${response.status} ${url.pathname}${url.search}`);
}

if (failures.length > 0) {
	for (const failure of failures) console.error(`smoke failed: ${failure}`);
	process.exitCode = 1;
}
