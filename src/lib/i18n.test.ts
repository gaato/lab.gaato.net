import { describe, expect, it } from 'vitest';

import { defaultLocale, resolveLocale } from './i18n';

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
