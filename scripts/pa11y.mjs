import pa11y from 'pa11y';

const baseUrl = new URL(process.env.SITE_URL ?? 'http://127.0.0.1:4173');
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
const paths = [
	'/',
	'/cellular-automaton/',
	'/cellular-automaton/?lang=ja',
	'/holodori/',
	'/holodori/event-pt/?current=1144899&target=1145141&bonus=20&passport=1',
	'/holodori/high-low/'
];
const failures = [];

for (const path of paths) {
	const url = new URL(path, baseUrl).toString();
	const result = await pa11y(url, {
		standard: 'WCAG2AA',
		timeout: 30_000,
		wait: 500,
		includeNotices: false,
		includeWarnings: false,
		chromeLaunchConfig: {
			...(executablePath ? { executablePath } : {}),
			args: ['--disable-dev-shm-usage', '--no-sandbox']
		}
	});

	for (const issue of result.issues) {
		failures.push(
			`${path}: ${issue.code}: ${issue.message}\n  ${issue.selector}\n  ${issue.context}`
		);
	}
}

if (failures.length > 0) {
	for (const failure of failures) console.error(failure);
	throw new Error(
		`Accessibility check failed with ${failures.length} problem${failures.length === 1 ? '' : 's'}`
	);
}

console.log(`Accessibility checks passed for ${paths.length} pages`);
