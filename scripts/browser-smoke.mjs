import assert from 'node:assert/strict';

import puppeteer from 'puppeteer';

const baseUrl = new URL(process.env.SITE_URL ?? 'http://127.0.0.1:4173');
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

const browser = await puppeteer.launch({
	headless: true,
	...(executablePath ? { executablePath } : {}),
	args: ['--disable-dev-shm-usage', '--no-sandbox']
});

const page = await browser.newPage();
page.setDefaultTimeout(15_000);
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));

async function open(path, expectedStatus = 200) {
	const response = await page.goto(new URL(path, baseUrl).toString(), {
		waitUntil: 'networkidle0'
	});
	assert(response, `No navigation response for ${path}`);
	assert.equal(
		response.status(),
		expectedStatus,
		`Unexpected status for ${path}`
	);
	await page.waitForSelector('h1');
}

async function mainText() {
	return page.$eval('main', (element) => element.textContent ?? '');
}

async function waitForMainText(fragment) {
	try {
		await page.waitForFunction(
			(expected) =>
				document.querySelector('main')?.textContent?.includes(expected),
			{},
			fragment
		);
	} catch (error) {
		throw new Error(
			`Timed out waiting for ${JSON.stringify(fragment)}. Main text: ${JSON.stringify(await mainText())}`,
			{ cause: error }
		);
	}
}

async function setValue(selector, value) {
	await page.$eval(
		selector,
		(element, nextValue) => {
			const input = /** @type {HTMLInputElement} */ (element);
			input.value = nextValue;
			input.dispatchEvent(new InputEvent('input', { bubbles: true }));
		},
		value
	);
}

async function clickButtonText(label) {
	const clicked = await page.$$eval(
		'button',
		(buttons, expected) => {
			const button = buttons.find(
				(candidate) => candidate.textContent?.trim() === expected
			);
			if (!button) return false;
			button.click();
			return true;
		},
		label
	);
	assert(clicked, `No button with exact text ${JSON.stringify(label)}`);
}

try {
	await open(
		'/holodori/event-pt/?current=1144899&target=1145141&bonus=20&passport=1&maxJumps=50&maxRuns=8&lang=ja'
	);
	await waitForMainText('あと 242 Pt');
	assert.match(await mainText(), /ホロドリ：イベントPt調整/u);
	assert.doesNotMatch(await mainText(), /例を入力/u);

	const exactPlanText = await mainText();
	assert.match(exactPlanText, /3回成功/u);
	assert.match(exactPlanText, /4回成功/u);

	await setValue('#current', '123456789');
	await page.waitForFunction(
		() => !document.querySelector('main')?.textContent?.includes('あと 242 Pt')
	);
	assert.equal(
		await page.$eval(
			'#current',
			(element) => /** @type {HTMLInputElement} */ (element).value
		),
		'123456789'
	);

	await page.select('#site-language', 'en');
	await page.waitForFunction(
		() =>
			document.documentElement.lang === 'en' &&
			new URL(window.location.href).searchParams.get('lang') === 'en'
	);
	assert.equal(
		await page.$eval(
			'#current',
			(element) => /** @type {HTMLInputElement} */ (element).value
		),
		'123456789',
		'Changing language discarded an unsaved form value'
	);

	await setValue('#current', '100');
	await setValue('#target', '99');
	await setValue('#bonus', '0');
	await setValue('#maxJumps', '50');
	await setValue('#maxRuns', '8');
	const passportChecked = await page.$eval(
		'#passport',
		(element) => /** @type {HTMLInputElement} */ (element).checked
	);
	if (passportChecked) await page.click('#passport');
	await page.click('button[type="submit"]');
	await waitForMainText('Target Pt must be at least the current Pt');

	await open(
		'/holodori/event-pt/?current=1144899&target=1145141&bonus=20&passport=1&maxJumps=50&maxRuns=8&lang=en'
	);
	await waitForMainText('242 Pt remaining');
	assert.deepEqual(
		await page.$$eval('nav[aria-label="Breadcrumb"] a', (links) =>
			links.map((link) => link.textContent?.trim())
		),
		['All tools', 'hololive Dreams'],
		'Event Pt breadcrumb hierarchy is incomplete'
	);
	await page.evaluate(() => {
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async (text) => {
					window.__copiedUrl = text;
				}
			}
		});
	});
	await page.click('button.btn-outline');
	await waitForMainText('URL copied');
	const copiedPageUrl = await page.evaluate(() => window.__copiedUrl);
	assert(copiedPageUrl, 'The copy button did not write a URL');
	assert.equal(
		new URL(copiedPageUrl).searchParams.get('lang'),
		'en',
		'The copied URL did not preserve the active language'
	);

	const searchLimitsOpen = await page.$eval(
		'form details',
		(element) => /** @type {HTMLDetailsElement} */ (element).open
	);
	if (searchLimitsOpen) await page.click('form details summary');
	await setValue('#maxJumps', '101');
	await page.click('button[type="submit"]');
	await page.waitForFunction(() =>
		document.querySelector('form details')?.hasAttribute('open')
	);
	await page.waitForFunction(() => document.activeElement?.id === 'maxJumps');
	assert.equal(
		await page.evaluate(() => document.activeElement?.id),
		'maxJumps',
		'The first invalid advanced field did not receive focus'
	);
	assert.equal(
		await page.$eval('#maxJumps', (element) => element.ariaInvalid),
		'true'
	);
	await setValue('#maxJumps', 'abc');
	assert.equal(
		await page.$eval('#maxJumps', (element) => element.ariaInvalid),
		'true',
		'Editing an invalid field incorrectly cleared its invalid state'
	);

	await open('/holodori/event-pt/?bonus=nope&maxRuns=999&lang=en');
	await waitForMainText('The URL contains invalid or missing values');
	assert.equal(
		await page.$eval(
			'#bonus',
			(element) => /** @type {HTMLInputElement} */ (element).value
		),
		'nope'
	);

	await open(
		'/holodori/event-pt/?current=0&target=90&bonus=0&passport=yes&maxJumps=50&maxRuns=2&lang=en'
	);
	await waitForMainText('The URL contains invalid or missing values');
	assert.equal(
		await page.$eval(
			'#passport',
			(element) => /** @type {HTMLInputElement} */ (element).checked
		),
		false,
		'An invalid passport query value was treated as enabled'
	);

	await open(
		'/holodori/event-pt/?current=9007199254740993&target=9007199254741038&bonus=0&passport=0&maxJumps=0&maxRuns=1&lang=en'
	);
	await waitForMainText('45 Pt remaining');
	assert.equal(
		await page.$eval(
			'#current',
			(element) => /** @type {HTMLInputElement} */ (element).value
		),
		'9007199254740993'
	);
	assert.match(await mainText(), /0 successes/u);

	await open(
		'/holodori/event-pt/?current=0&target=47&bonus=0&passport=0&maxJumps=1&maxRuns=1&lang=en'
	);
	await waitForMainText('1 plan found');
	const singularText = await mainText();
	assert.match(singularText, /1 run/u);
	assert.match(singularText, /1 success/u);
	assert.doesNotMatch(singularText, /1 (?:runs|successes|plans)/u);

	await open('/holodori/high-low/?lang=en');
	await waitForMainText('Choose five cards');
	assert.deepEqual(
		await page.$$eval('nav[aria-label="Breadcrumb"] a', (links) =>
			links.map((link) => link.textContent?.trim())
		),
		['All tools', 'hololive Dreams'],
		'High & Low breadcrumb hierarchy is incomplete'
	);

	for (const [rank, suit] of [
		['10', 'Spades'],
		['J', 'Spades'],
		['Q', 'Spades'],
		['K', 'Spades'],
		['2', 'Hearts']
	]) {
		await clickButtonText(rank);
		await page.click(`button[aria-label="${suit}"]`);
	}
	await waitForMainText('Keep 4');
	const highLowResultText = await mainText();
	assert.match(highLowResultText, /Expected total payout/u);
	assert.match(highLowResultText, /Winning-hand rate/u);

	await page.click('button[aria-label^="Card 1 "]');
	await clickButtonText('J');
	await waitForMainText('That card is already in your hand');

	await clickButtonText('Clear all');
	await waitForMainText('Choose five cards');
	await clickButtonText('JOKER');
	assert.match(
		await page.$eval(
			'button[aria-label^="Card 1 "]',
			(element) => element.getAttribute('aria-label') ?? ''
		),
		/JOKER/u
	);
	await clickButtonText('JOKER');
	await waitForMainText('That card is already in your hand');

	// Verify the fallback itself remains useful even if the hosting platform adds
	// unrelated scripts (for example, Cloudflare security instrumentation).
	await page.setJavaScriptEnabled(false);
	await open('/this-lab-route-does-not-exist/', 404);
	assert.match(await mainText(), /ページが見つかりません/u);
	assert.deepEqual(
		pageErrors,
		[],
		`Browser page errors: ${pageErrors.join('; ')}`
	);

	console.log('browser smoke passed');
} finally {
	await browser.close();
}
