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
await page.setCacheEnabled(false);
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
	return page.$eval('main', (element) =>
		(element.textContent ?? '').replace(/\s+/gu, ' ').trim()
	);
}

async function waitForMainText(fragment) {
	try {
		await page.waitForFunction(
			(expected) =>
				(document.querySelector('main')?.textContent ?? '')
					.replace(/\s+/gu, ' ')
					.trim()
					.includes(expected),
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
	await open('/cellular-automaton/?lang=en');
	await waitForMainText('Life-like B/S notation');
	assert.deepEqual(
		await page.$$eval(
			'footer nav[aria-label="Project information"] a',
			(links) => links.map((link) => link.textContent?.trim())
		),
		['Source', 'License', 'Third-party notices'],
		'Project links are missing from the shared footer'
	);
	assert.deepEqual(
		await page.$$eval('nav[aria-label="Breadcrumb"] a', (links) =>
			links.map((link) => link.textContent?.trim())
		),
		['All tools'],
		'Cellular Automaton breadcrumb hierarchy is incomplete'
	);
	await page.waitForFunction(() => {
		const canvas = document.querySelector('.automaton-canvas canvas');
		if (
			!(canvas instanceof HTMLCanvasElement) ||
			canvas.width === 0 ||
			canvas.height === 0
		) {
			return false;
		}
		const context = canvas.getContext('2d');
		if (!context) return false;
		return context
			.getImageData(0, 0, canvas.width, canvas.height)
			.data.some((value, index) => index % 4 === 3 && value !== 0);
	});

	await setValue('#automaton-rule', 'b82 / s755');
	await page.click('button[type="submit"]');
	await waitForMainText('Custom B28/S57');
	assert.equal(
		await page.$eval(
			'#automaton-rule',
			(element) => /** @type {HTMLInputElement} */ (element).value
		),
		'B28/S57'
	);
	await clickButtonText('Pause');
	assert.equal(
		await page.$eval('#automaton-rule', (element) => element.ariaInvalid),
		'false'
	);
	assert.equal(
		await page.$eval('[data-testid="automaton-toggle"]', (element) =>
			element.getAttribute('aria-pressed')
		),
		'true'
	);

	await page.select('#site-language', 'ja');
	await page.waitForFunction(
		() =>
			document.documentElement.lang === 'ja' &&
			new URL(window.location.href).searchParams.get('lang') === 'ja'
	);
	await waitForMainText('カスタム B28/S57');
	assert.equal(
		await page.$eval(
			'#automaton-rule',
			(element) => /** @type {HTMLInputElement} */ (element).value
		),
		'B28/S57',
		'Changing language discarded the active automaton rule'
	);
	assert.equal(
		await page.$eval('[data-testid="automaton-toggle"]', (element) =>
			element.getAttribute('aria-pressed')
		),
		'true',
		'Changing language discarded the paused state'
	);

	await setValue('#automaton-rule', 'B9/S23');
	await page.click('button[type="submit"]');
	assert.equal(
		await page.$eval('#automaton-rule', (element) => element.ariaInvalid),
		'true'
	);
	await waitForMainText('0から8までの数字');

	await page.setViewport({ width: 320, height: 800, deviceScaleFactor: 1 });
	await open('/cellular-automaton/?lang=en');
	assert(
		await page.evaluate(
			() =>
				document.documentElement.scrollWidth <=
				document.documentElement.clientWidth + 1
		),
		'Cellular Automaton overflows a 320px viewport'
	);
	await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });

	await page.emulateMediaFeatures([
		{ name: 'prefers-reduced-motion', value: 'reduce' }
	]);
	await open('/cellular-automaton/?lang=en');
	await waitForMainText(
		'Automatic motion is disabled by your system preference.'
	);
	assert(
		await page.$eval(
			'[data-testid="automaton-toggle"]',
			(element) => /** @type {HTMLButtonElement} */ (element).disabled
		),
		'Reduced motion did not disable automatic playback'
	);
	await page.emulateMediaFeatures([]);

	const mediaSession = await page.createCDPSession();
	await mediaSession.send('Emulation.setEmulatedMedia', {
		features: [{ name: 'forced-colors', value: 'active' }]
	});
	await open('/cellular-automaton/?lang=en');
	await waitForMainText(
		'Cellular automaton is unavailable in forced-colors mode.'
	);
	assert(
		await page.$eval(
			'#automaton-rule',
			(element) => /** @type {HTMLInputElement} */ (element).disabled
		),
		'Forced colors did not disable the visual control'
	);
	assert.equal(
		await page.$eval(
			'.automaton-canvas',
			(element) => getComputedStyle(element).display
		),
		'none',
		'Forced colors did not hide the canvas'
	);
	await mediaSession.send('Emulation.setEmulatedMedia', { features: [] });
	await mediaSession.detach();

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
		Object.defineProperty(navigator, 'share', {
			configurable: true,
			value: undefined
		});
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: {
				writeText: async (text) => {
					window.__copiedUrl = text;
				}
			}
		});
	});
	await clickButtonText('Share this tool');
	await waitForMainText('URL copied');
	const copiedPageUrl = await page.evaluate(() => window.__copiedUrl);
	assert(copiedPageUrl, 'The copy button did not write a URL');
	const copiedEventUrl = new URL(copiedPageUrl);
	assert.equal(
		copiedEventUrl.pathname,
		'/holodori/event-pt/',
		'The copied URL did not point to the Event Pt tool'
	);
	assert.equal(
		copiedEventUrl.searchParams.toString(),
		'lang=en',
		'The copied tool URL included inputs or omitted the active language'
	);
	assert.equal(
		new URL(page.url()).searchParams.get('current'),
		'1144899',
		'Sharing the tool changed the current page URL'
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

	await open('/holodori/high-low/?lang=en&junk=1');
	await waitForMainText('Choose five cards');
	await waitForMainText("Today's 30k route");
	assert(
		await page.$eval('#high-low-card-slot-1', (cardSlot) => {
			const route = document.querySelector('#daily-route-heading');
			return Boolean(
				route &&
				cardSlot.compareDocumentPosition(route) &
					Node.DOCUMENT_POSITION_FOLLOWING
			);
		}),
		'The post-draw route appeared before the initial hand input'
	);
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

	await page.select('#daily-hand-rank', 'two-pair');
	await waitForMainText('Cash out 12,800 coins after 6 successful double-ups');
	assert.equal(
		await page.$eval(
			'#daily-double-ups',
			(element) => /** @type {HTMLSelectElement} */ (element).value
		),
		'',
		'The actual cashout count was filled before the game result was known'
	);
	await page.select('#daily-double-ups', '6');
	await page.click('#daily-add-payout');
	await waitForMainText('12,800 / 30,000 coins');
	assert.match(
		await page.$eval(
			'#high-low-card-slot-1',
			(element) => element.textContent ?? ''
		),
		/10/u,
		'Recording a cashout unexpectedly cleared the initial hand'
	);

	await page.select('#daily-hand-rank', 'three-of-a-kind');
	await waitForMainText('The 19,200-coin subtotal is ready');
	assert.equal(
		await page.$eval(
			'#daily-double-ups',
			(element) => /** @type {HTMLSelectElement} */ (element).value
		),
		'',
		'The second actual cashout count was filled before the result'
	);
	await page.select('#daily-double-ups', '5');
	await page.click('#daily-add-payout');
	await waitForMainText('19,200 / 30,000 coins');

	await page.select('#daily-hand-rank', 'flush');
	await page.select('#daily-double-ups', '0');
	await page.click('#daily-add-payout');
	await waitForMainText('19,900 / 30,000 coins');

	await page.select('#site-language', 'ja');
	await page.waitForFunction(
		() =>
			document.documentElement.lang === 'ja' &&
			new URL(window.location.href).searchParams.get('lang') === 'ja'
	);
	await waitForMainText('4枚を残す');
	assert.doesNotMatch(
		await mainText(),
		/Keep 4/u,
		'The English strategy heading remained after switching to Japanese'
	);
	await page.evaluate(() => {
		Object.defineProperty(navigator, 'share', {
			configurable: true,
			value: async (data) => {
				window.__sharedData = data;
			}
		});
	});
	await clickButtonText('このツールを共有');
	const sharedData = await page.evaluate(() => window.__sharedData);
	assert(sharedData, 'The Web Share API did not receive share data');
	assert.equal(
		sharedData.title,
		'ホロドリ：ハイ&ロー手札判断',
		'The shared title was not the current localized tool title'
	);
	assert.equal(
		sharedData.text,
		'カードオブグリードの5枚から、残すカードを計算します。',
		'The share data included something other than the tool description'
	);
	const sharedHighLowUrl = new URL(sharedData.url);
	assert.equal(sharedHighLowUrl.pathname, '/holodori/high-low/');
	assert.equal(
		sharedHighLowUrl.searchParams.toString(),
		'lang=ja',
		'The shared tool URL included unrelated query parameters'
	);

	await page.select('#site-language', 'en');
	await page.waitForFunction(
		() =>
			document.documentElement.lang === 'en' &&
			new URL(window.location.href).searchParams.get('lang') === 'en'
	);
	await waitForMainText('Keep 4');
	assert.doesNotMatch(
		await mainText(),
		/4枚を残す/u,
		'The Japanese strategy heading remained after switching to English'
	);

	await page.click('button[aria-label^="Card 1 "]');
	await clickButtonText('J');
	await waitForMainText('That card is already in your hand');

	await page.click('#high-low-next-game');
	await page.waitForFunction(
		() => document.activeElement?.id === 'high-low-card-slot-1'
	);
	assert.match(
		await page.$eval(
			'#high-low-card-slot-1',
			(element) => element.textContent ?? ''
		),
		/Not selected/u,
		'The explicit next-game action did not clear the hand'
	);
	await waitForMainText('19,900 / 30,000 coins');

	await open('/holodori/high-low/?lang=en&junk=3');
	await waitForMainText('19,900 / 30,000 coins');
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
	assert.equal(
		await page.$eval('html', (element) => element.lang),
		'en',
		'The static document did not use the English fallback language'
	);
	assert.match(await mainText(), /Page not found/u);
	assert.deepEqual(
		pageErrors,
		[],
		`Browser page errors: ${pageErrors.join('; ')}`
	);

	console.log('browser smoke passed');
} finally {
	await browser.close();
}
