import assert from 'node:assert/strict';

import puppeteer from 'puppeteer';

const baseUrl = new URL(process.env.SITE_URL ?? 'http://127.0.0.1:4173');
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

const browser = await puppeteer.launch({
	headless: true,
	...(executablePath ? { executablePath } : {}),
	args: ['--disable-dev-shm-usage', '--no-sandbox']
});

function collectBrowserProblems(targetPage, staticFallback = false) {
	const problems = [];
	targetPage.on('console', (message) => {
		const text = message.text();
		if (
			message.type() === 'error' &&
			!(
				staticFallback &&
				text.includes(
					'Failed to load resource: the server responded with a status of 404'
				)
			)
		) {
			problems.push(`console: ${text}`);
		}
		if (message.type() === 'warn' && /hydration|svelte/iu.test(text)) {
			problems.push(`console warning: ${text}`);
		}
	});
	targetPage.on('pageerror', (error) =>
		problems.push(`page error: ${error.message}`)
	);
	targetPage.on('requestfailed', (request) => {
		if (staticFallback && request.resourceType() === 'script') return;
		problems.push(
			`request failed: ${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown error'})`
		);
	});
	return problems;
}

const page = await browser.newPage();
await page.setCacheEnabled(false);
page.setDefaultTimeout(15_000);
const browserProblems = collectBrowserProblems(page);

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

async function injectJellyGifImage() {
	await page.evaluate(async () => {
		const canvas = document.createElement('canvas');
		canvas.width = 64;
		canvas.height = 48;
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Could not create the sample image context');
		const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
		gradient.addColorStop(0, '#f43f5e');
		gradient.addColorStop(1, '#3b82f6');
		context.fillStyle = gradient;
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.clearRect(0, 0, 10, 10);
		const blob = await new Promise((resolve) =>
			canvas.toBlob(resolve, 'image/png')
		);
		if (!blob) throw new Error('Could not create the sample PNG');
		const file = new File([blob], 'sample.png', { type: 'image/png' });
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		const input = document.querySelector('#jelly-gif-file');
		if (!(input instanceof HTMLInputElement)) {
			throw new Error('Could not find the Jelly GIF file input');
		}
		input.files = dataTransfer.files;
		input.dispatchEvent(new Event('change', { bubbles: true }));
	});
}

async function injectJellyGifBackgroundImage() {
	await page.evaluate(async () => {
		const canvas = document.createElement('canvas');
		canvas.width = 16;
		canvas.height = 16;
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Could not create the background context');
		context.fillStyle = '#0000ff';
		context.fillRect(0, 0, canvas.width, canvas.height);
		const blob = await new Promise((resolve) =>
			canvas.toBlob(resolve, 'image/png')
		);
		if (!blob) throw new Error('Could not create the background PNG');
		const file = new File([blob], 'background.png', { type: 'image/png' });
		const dataTransfer = new DataTransfer();
		dataTransfer.items.add(file);
		const input = document.querySelector('#jelly-gif-background-file');
		if (!(input instanceof HTMLInputElement)) {
			throw new Error('Could not find the Jelly GIF background input');
		}
		input.files = dataTransfer.files;
		input.dispatchEvent(new Event('change', { bubbles: true }));
	});
}

async function jellyGifResultPixel(x, y) {
	return page.$eval(
		'[data-testid="jelly-gif-result"]',
		(element, pixel) => {
			const image = /** @type {HTMLImageElement} */ (element);
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Could not decode the generated GIF');
			context.drawImage(image, 0, 0);
			const [r, g, b, a] = context.getImageData(pixel.x, pixel.y, 1, 1).data;
			return { r, g, b, a };
		},
		{ x, y }
	);
}

async function jellyGifAchievedSpeed() {
	return page.$eval('output[for="jelly-gif-speed"]', (element) => {
		const frames = Number(
			(element.textContent ?? '').match(/(\d+)\s*(?:frames|フレーム)/u)?.[1]
		);
		const delay = Number(
			/** @type {HTMLInputElement} */ (
				document.querySelector('#jelly-gif-delay')
			).value
		);
		return 100 / (delay * frames);
	});
}

try {
	await page.emulateMediaFeatures([
		{ name: 'prefers-color-scheme', value: 'light' }
	]);
	await open('/cellular-automaton/?lang=en');
	await waitForMainText('Life-like B/S notation');
	assert.deepEqual(
		await page.$$eval(
			'footer nav[aria-label="Project information"] a',
			(links) => links.map((link) => link.textContent?.trim())
		),
		['Source', 'License', 'Third-party notices', 'Developer'],
		'Project links are missing from the shared footer'
	);
	assert.deepEqual(
		await page.$eval('#site-theme', (button) => ({
			label: button.getAttribute('aria-label'),
			pressed: button.getAttribute('aria-pressed')
		})),
		{ label: 'Use dark theme', pressed: 'false' },
		'The theme button did not start in system mode'
	);
	await page.click('#site-theme');
	await page.waitForFunction(
		() => document.documentElement.dataset.theme === 'dark'
	);
	assert.deepEqual(
		await page.$eval('#site-theme', (button) => ({
			theme: document.documentElement.dataset.theme,
			colorScheme: document
				.querySelector('meta[name="color-scheme"]')
				?.getAttribute('content'),
			stored: localStorage.getItem('lab.gaato.net.theme'),
			label: button.getAttribute('aria-label'),
			pressed: button.getAttribute('aria-pressed')
		})),
		{
			theme: 'dark',
			colorScheme: 'dark',
			stored: 'dark',
			label: 'Use system theme',
			pressed: 'true'
		},
		'The theme button did not persist the dark override'
	);
	await page.reload({ waitUntil: 'networkidle0' });
	assert.equal(
		await page.$eval('html', (element) => element.dataset.theme),
		'dark',
		'The stored theme was not restored after reloading'
	);
	await page.click('#site-theme');
	await page.waitForFunction(
		() => !document.documentElement.hasAttribute('data-theme')
	);
	assert.deepEqual(
		await page.$eval('#site-theme', (button) => ({
			colorScheme: document
				.querySelector('meta[name="color-scheme"]')
				?.getAttribute('content'),
			stored: localStorage.getItem('lab.gaato.net.theme'),
			label: button.getAttribute('aria-label'),
			pressed: button.getAttribute('aria-pressed')
		})),
		{
			colorScheme: 'light dark',
			stored: null,
			label: 'Use dark theme',
			pressed: 'false'
		},
		'The theme button did not restore the system preference'
	);
	await page.emulateMediaFeatures([
		{ name: 'prefers-color-scheme', value: 'dark' }
	]);
	await page.waitForFunction(
		() =>
			document.querySelector('#site-theme')?.getAttribute('aria-label') ===
			'Use light theme'
	);
	assert.equal(
		await page.$eval('html', (element) => element.getAttribute('data-theme')),
		null,
		'The system theme change unexpectedly pinned a daisyUI theme'
	);
	await page.emulateMediaFeatures([
		{ name: 'prefers-color-scheme', value: 'light' }
	]);
	await page.waitForFunction(
		() =>
			document.querySelector('#site-theme')?.getAttribute('aria-label') ===
			'Use dark theme'
	);
	await page.setViewport({ width: 320, height: 800, deviceScaleFactor: 1 });
	assert.equal(
		await page.$eval('header', (element) =>
			Boolean(element.clientWidth && element.scrollWidth <= element.clientWidth)
		),
		true,
		'The shared header overflowed at the minimum supported width'
	);
	await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });
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
	assert.match(await mainText(), /イベントPt調整/u);
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
	assert.equal(
		await page.$eval('#recommendation-breakdown summary', (element) =>
			element.textContent?.trim()
		),
		'Recommendation breakdown'
	);
	assert(
		await page.$eval('#recommendation-breakdown', (details) => {
			const result = document.querySelector(
				'section[aria-labelledby="result-heading"]'
			);
			const method = document.querySelector('#calculation-method');
			const route = document.querySelector('#daily-route-heading');
			return Boolean(
				result?.contains(details) &&
				method &&
				result.contains(method) &&
				route &&
				details.compareDocumentPosition(method) &
					Node.DOCUMENT_POSITION_FOLLOWING &&
				method.compareDocumentPosition(route) & Node.DOCUMENT_POSITION_FOLLOWING
			);
		}),
		'The recommendation details were not grouped with the result before the daily route'
	);

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
		'カードオブグリードの5枚から、残すカードを計算します。 #ホロドリ',
		'The Japanese share data did not include the localized hashtag'
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
	await page.evaluate(() => {
		window.__sharedData = null;
	});
	await clickButtonText('Share this tool');
	await page.waitForFunction(() => window.__sharedData);
	const sharedEnglishData = await page.evaluate(() => window.__sharedData);
	assert.equal(
		sharedEnglishData.text,
		'Choose the five Card of Greed cards to calculate which cards to keep. #holodori',
		'The English share data did not include the localized hashtag'
	);
	assert.equal(
		new URL(sharedEnglishData.url).searchParams.toString(),
		'lang=en',
		'The English share URL did not use the current locale'
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

	await page.evaluateOnNewDocument(() => {
		navigator.canShare = () => true;
		navigator.share = async (data) => {
			window.__sharedFiles = Array.from(data.files ?? []).map((file) => ({
				name: file.name,
				type: file.type,
				size: file.size
			}));
		};
	});
	await open('/jelly-gif/?lang=en');
	await waitForMainText('Jelly GIF maker');
	assert.deepEqual(
		await page.$$eval('nav[aria-label="Breadcrumb"] li', (items) =>
			items.map((item) => item.textContent?.trim())
		),
		['All tools', 'Jelly GIF maker'],
		'Jelly GIF breadcrumb hierarchy is incomplete'
	);
	await injectJellyGifImage();
	await page.waitForFunction(() => {
		const canvas = document.querySelector('[role="img"] canvas');
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
	await setValue('#jelly-gif-amplitude-range', '20');
	assert.equal(
		await page.$eval('#jelly-gif-amplitude', (element) => element.value),
		'20',
		'The Jelly GIF amplitude number input did not follow the range'
	);
	await setValue('#jelly-gif-amplitude', '999');
	await page.$eval('#jelly-gif-amplitude', (element) =>
		element.dispatchEvent(new Event('change', { bubbles: true }))
	);
	assert.equal(
		await page.$eval('#jelly-gif-amplitude', (element) => element.value),
		'64',
		'The Jelly GIF amplitude number input did not snap to its clamped value'
	);
	await setValue('#jelly-gif-amplitude', '4');
	await setValue('#jelly-gif-speed', '2');
	await page.$eval('#jelly-gif-speed', (element) =>
		element.dispatchEvent(new Event('change', { bubbles: true }))
	);
	const committedSpeed = await page.$eval('#jelly-gif-speed', (element) =>
		Number(element.value)
	);
	const achievedSpeed = await jellyGifAchievedSpeed();
	assert.equal(
		committedSpeed.toFixed(2),
		achievedSpeed.toFixed(2),
		'The Jelly GIF speed target did not snap to the achieved speed'
	);
	assert.match(
		await page.$eval(
			'output[for="jelly-gif-speed"]',
			(element) => element.textContent ?? ''
		),
		/frames/u,
		'The Jelly GIF speed output did not include the frame count'
	);
	await setValue('#jelly-gif-delay', '10');
	await page.$eval('#jelly-gif-delay', (element) =>
		element.dispatchEvent(new Event('change', { bubbles: true }))
	);
	assert.equal(
		await page.$eval('#jelly-gif-speed', (element) =>
			Number(element.value).toFixed(2)
		),
		(await jellyGifAchievedSpeed()).toFixed(2),
		'The Jelly GIF speed target did not match the achieved speed after changing the frame delay'
	);
	assert.match(
		await page.$eval(
			'output[for="jelly-gif-delay"]',
			(element) => element.textContent ?? ''
		),
		/fps/u,
		'The Jelly GIF frame-delay output did not include fps'
	);
	await page.click('[data-testid="jelly-gif-generate"]');
	await page.waitForSelector('[data-testid="jelly-gif-result"]');
	await page.waitForFunction(() => {
		const image = document.querySelector('[data-testid="jelly-gif-result"]');
		return (
			image instanceof HTMLImageElement &&
			image.complete &&
			image.naturalWidth > 0
		);
	});
	assert.deepEqual(
		await page.$eval('[data-testid="jelly-gif-result"]', (element) => {
			const image = /** @type {HTMLImageElement} */ (element);
			return { width: image.naturalWidth, height: image.naturalHeight };
		}),
		{ width: 64 + 2 * 4, height: 48 + 2 * 4 },
		'The generated GIF dimensions did not include the wobble margin'
	);
	assert.deepEqual(
		await page.$eval('[data-testid="jelly-gif-download"]', (element) => ({
			hasBlobUrl: element.getAttribute('href')?.startsWith('blob:') ?? false,
			download: element.getAttribute('download')
		})),
		{ hasBlobUrl: true, download: 'jelly-sample.gif' },
		'The Jelly GIF download metadata is incorrect'
	);
	await page.click('[data-testid="jelly-gif-share"]');
	await page.waitForFunction(() => Array.isArray(window.__sharedFiles));
	assert.deepEqual(
		await page.evaluate(() => ({
			count: window.__sharedFiles.length,
			type: window.__sharedFiles[0]?.type,
			hasBytes: window.__sharedFiles[0]?.size > 0,
			isGifName: window.__sharedFiles[0]?.name.endsWith('.gif') ?? false
		})),
		{ count: 1, type: 'image/gif', hasBytes: true, isGifName: true },
		'The Jelly GIF share payload is incorrect'
	);
	assert.deepEqual(
		await page.$eval('[data-testid="jelly-gif-result"]', (element) => {
			const image = /** @type {HTMLImageElement} */ (element);
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Could not decode the generated GIF');
			context.drawImage(image, 0, 0);
			return {
				centerAlpha: context.getImageData(
					Math.floor(canvas.width / 2),
					Math.floor(canvas.height / 2),
					1,
					1
				).data[3],
				marginAlpha: context.getImageData(1, 1, 1, 1).data[3]
			};
		}),
		{ centerAlpha: 255, marginAlpha: 0 },
		'The browser did not decode the generated GIF with the expected alpha values'
	);
	assert.match(
		await page.$eval('[role="status"]', (element) => element.textContent ?? ''),
		/GIF ready/u,
		'The Jelly GIF completion status was not announced'
	);

	await page.select('#jelly-gif-background', 'color');
	await setValue('#jelly-gif-video-background', '#ff0000');
	let previousResultUrl = await page.$eval(
		'[data-testid="jelly-gif-result"]',
		(element) => element.getAttribute('src')
	);
	await page.click('[data-testid="jelly-gif-generate"]');
	await page.waitForFunction(
		(previousUrl) => {
			const image = document.querySelector('[data-testid="jelly-gif-result"]');
			return (
				image instanceof HTMLImageElement &&
				image.complete &&
				image.getAttribute('src') !== previousUrl
			);
		},
		{},
		previousResultUrl
	);
	const redBackgroundPixel = await jellyGifResultPixel(1, 1);
	assert(
		redBackgroundPixel.a === 255 &&
			redBackgroundPixel.r > 200 &&
			redBackgroundPixel.g < 60,
		`The Jelly GIF colour background pixel was incorrect: ${JSON.stringify(redBackgroundPixel)}`
	);

	await page.select('#jelly-gif-background', 'image');
	await page.waitForSelector('#jelly-gif-background-file');
	await injectJellyGifBackgroundImage();
	await page.waitForFunction(() =>
		(
			document.querySelector('#jelly-gif-background-file')?.parentElement
				?.textContent ?? ''
		).includes('background.png')
	);
	previousResultUrl = await page.$eval(
		'[data-testid="jelly-gif-result"]',
		(element) => element.getAttribute('src')
	);
	await page.click('[data-testid="jelly-gif-generate"]');
	await page.waitForFunction(
		(previousUrl) => {
			const image = document.querySelector('[data-testid="jelly-gif-result"]');
			return (
				image instanceof HTMLImageElement &&
				image.complete &&
				image.getAttribute('src') !== previousUrl
			);
		},
		{},
		previousResultUrl
	);
	const blueBackgroundPixel = await jellyGifResultPixel(1, 1);
	assert(
		blueBackgroundPixel.a === 255 &&
			blueBackgroundPixel.b > 200 &&
			blueBackgroundPixel.r < 60,
		`The Jelly GIF image background pixel was incorrect: ${JSON.stringify(blueBackgroundPixel)}`
	);
	const recordVideoButton = await page.$('[data-testid="jelly-gif-record"]');
	assert(
		recordVideoButton,
		'The Jelly GIF video record button is missing; headless Chromium should support MediaRecorder and canvas captureStream'
	);
	await recordVideoButton.click();
	await page.waitForSelector('[data-testid="jelly-gif-video"]', {
		timeout: 15_000
	});
	assert(
		await page.$eval('[data-testid="jelly-gif-video"]', (element) =>
			element.getAttribute('src')?.startsWith('blob:')
		),
		'The recorded Jelly GIF video did not use a blob URL'
	);
	await page.waitForFunction(() => {
		const video = document.querySelector('[data-testid="jelly-gif-video"]');
		return video instanceof HTMLVideoElement && video.readyState >= 1;
	});
	assert.deepEqual(
		await page.$eval('[data-testid="jelly-gif-video"]', (element) => {
			const video = /** @type {HTMLVideoElement} */ (element);
			return { width: video.videoWidth, height: video.videoHeight };
		}),
		{ width: 64 + 2 * 4, height: 48 + 2 * 4 },
		'The recorded Jelly GIF video dimensions did not include the wobble margin'
	);
	assert.match(
		await page.$eval(
			'[data-testid="jelly-gif-video-download"]',
			(element) => element.getAttribute('download') ?? ''
		),
		/\.(?:webm|mp4)$/u,
		'The Jelly GIF video download name has an unsupported extension'
	);

	await page.select('#site-language', 'ja');
	await page.waitForFunction(
		() =>
			document.documentElement.lang === 'ja' &&
			new URL(window.location.href).searchParams.get('lang') === 'ja'
	);
	await waitForMainText('ふにゃふにゃGIF');
	assert(
		await page.$('[data-testid="jelly-gif-result"]'),
		'Changing language discarded the generated Jelly GIF'
	);
	await page.select('#site-language', 'en');
	await page.waitForFunction(
		() =>
			document.documentElement.lang === 'en' &&
			new URL(window.location.href).searchParams.get('lang') === 'en'
	);

	await page.emulateMediaFeatures([
		{ name: 'prefers-reduced-motion', value: 'reduce' }
	]);
	await open('/jelly-gif/?lang=en');
	await injectJellyGifImage();
	await page.waitForSelector('[role="img"] canvas');
	assert.equal(
		await page.$eval('[data-testid="jelly-gif-preview-toggle"]', (element) =>
			element.getAttribute('aria-pressed')
		),
		'false',
		'Reduced motion did not disable Jelly GIF preview autoplay'
	);
	await waitForMainText(
		'Autoplay is off because your system prefers reduced motion.'
	);
	await page.click('[data-testid="jelly-gif-preview-toggle"]');
	assert.equal(
		await page.$eval('[data-testid="jelly-gif-preview-toggle"]', (element) =>
			element.getAttribute('aria-pressed')
		),
		'true',
		'The Jelly GIF preview could not be explicitly enabled'
	);
	await page.emulateMediaFeatures([]);

	await page.setViewport({ width: 320, height: 800, deviceScaleFactor: 1 });
	await open('/jelly-gif/?lang=en');
	assert(
		await page.evaluate(
			() =>
				document.documentElement.scrollWidth <=
				document.documentElement.clientWidth + 1
		),
		'Jelly GIF maker overflows a 320px viewport'
	);
	await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 1 });

	// Verify the fallback itself remains useful even if the hosting platform adds
	// unrelated scripts (for example, Cloudflare security instrumentation).
	assert.deepEqual(
		browserProblems,
		[],
		`Browser problems before the static fallback check: ${browserProblems.join('; ')}`
	);
	const fallbackPage = await browser.newPage();
	fallbackPage.setDefaultTimeout(15_000);
	const fallbackProblems = collectBrowserProblems(fallbackPage, true);
	await fallbackPage.setJavaScriptEnabled(false);
	const fallbackResponse = await fallbackPage.goto(
		new URL('/this-lab-route-does-not-exist/', baseUrl).toString(),
		{ waitUntil: 'networkidle0' }
	);
	assert(fallbackResponse, 'No navigation response for the static fallback');
	assert.equal(
		fallbackResponse.status(),
		404,
		'The static fallback was not a 404'
	);
	await fallbackPage.waitForSelector('h1');
	assert.equal(
		await fallbackPage.$eval('html', (element) => element.lang),
		'en',
		'The static document did not use the English fallback language'
	);
	assert.match(
		await fallbackPage.$eval('main', (element) => element.textContent ?? ''),
		/Page not found/u
	);
	assert.deepEqual(
		fallbackProblems,
		[],
		`Static fallback browser problems: ${fallbackProblems.join('; ')}`
	);
	await fallbackPage.close();

	console.log('browser smoke passed');
} finally {
	await browser.close();
}
