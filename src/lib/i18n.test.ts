import { describe, expect, it } from 'vitest';

import { defaultLocale, resolveLocale, translate } from './i18n';

describe('locale resolution', () => {
	it('uses English when no supported preference is available', () => {
		expect(defaultLocale).toBe('en');
		expect(resolveLocale(null, null, [])).toBe('en');
		expect(resolveLocale(null, null, ['fr-FR'])).toBe('en');
	});

	it('prefers the query, then storage, then the browser language', () => {
		expect(resolveLocale('ja', 'en', ['en-US'])).toBe('ja');
		expect(resolveLocale(null, 'ja', ['en-US'])).toBe('ja');
		expect(resolveLocale(null, null, ['ja-JP', 'en-US'])).toBe('ja');
	});
});

describe('Holodori titles', () => {
	it('keeps product context globally and removes it inside the collection', () => {
		expect(translate('ja', 'home.eventPointTitle')).toBe(
			'ホロドリ：イベントPt調整'
		);
		expect(translate('ja', 'event.heading')).toBe('イベントPt調整');
		expect(translate('ja', 'holodori.eventPointTitle')).toBe('イベントPt調整');
		expect(translate('ja', 'highLow.heading')).toBe('ハイ&ロー手札判断');
		expect(translate('ja', 'holodori.highLowTitle')).toBe('ハイ&ロー手札判断');
	});
});
