import { writable } from 'svelte/store';

export const supportedLocales = ['ja', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'ja';
export const localeStorageKey = 'lab.gaato.net.locale';

const ja = {
	'site.name': 'gaato lab',
	'site.home': 'ツール一覧',
	'site.language': '言語',
	'language.ja': '日本語',
	'language.en': 'English',
	'home.title': 'gaato lab',
	'home.description': 'gaato labのツール一覧。',
	'home.collection': 'ツール',
	'home.eventPointTitle': 'ホロドリ：イベントPt調整',
	'event.title': 'イベントPt調整 | gaato lab',
	'event.description':
		'ホロライブ ドリームスのイベントPtを、ホッピンロープで目標値に合わせる手順を計算します。',
	'event.unofficial':
		'非公式のファンメイドツールです。カバー株式会社およびゲーム運営元とは関係ありません。',
	'event.heading': 'イベントPt調整',
	'event.summary':
		'ホッピンロープの成功回数を組み合わせて、目標Ptに合わせます。',
	'event.zeroBoost': '0ブースト',
	'event.formLegend': '条件',
	'event.currentLabel': '現在Pt',
	'event.targetLabel': '目標Pt',
	'event.bonusLabel': 'イベントボーナス',
	'event.bonusUnit': '%',
	'event.bonusHint': '編成画面の合計ボーナス。0.1%単位で入力できます。',
	'event.passportLabel': 'ホロパスポートを使用',
	'event.passportHint': '獲得Ptが2倍になります。',
	'event.limitLegend': '探索範囲',
	'event.maxJumpsLabel': '1プレイの最大成功回数',
	'event.maxJumpsHint': '止められる最大回数を指定します。',
	'event.maxRunsLabel': '最大プレイ数',
	'event.maxRunsHint': '1〜20プレイ。',
	'event.calculate': '計算',
	'event.example': '例を入力',
	'event.resultHeading': '計算結果',
	'event.emptyBody': '条件を入力して「計算」を押してください。',
	'event.delta': 'あと {points} Pt',
	'event.planCountOne': '{count}件の手順が見つかりました。',
	'event.planCount': '{count}件の手順が見つかりました。',
	'event.noPlayHeading': 'すでに目標Ptです',
	'event.noPlayBody': '追加のプレイは必要ありません。',
	'event.planLabel': '候補 {index}',
	'event.playsOne': '{count}プレイ',
	'event.plays': '{count}プレイ',
	'event.totalJumpsOne': '成功回数の合計 {count}回',
	'event.totalJumps': '成功回数の合計 {count}回',
	'event.actionOne': '{jumps}回成功',
	'event.action': '{jumps}回成功',
	'event.actionRepeatedOne': '{jumps}回成功を{count}回',
	'event.actionRepeated': '{jumps}回成功を{count}回',
	'event.actionReward': '1プレイ {points} Pt',
	'event.planReward': '合計 {points} Pt',
	'event.copyUrl': 'URLをコピー',
	'event.copied': 'URLをコピーしました。',
	'event.copyFailed':
		'URLをコピーできませんでした。ブラウザのアドレス欄からコピーしてください。',
	'event.queryIgnored':
		'URL内の値が無効または不足しているため、計算には使用していません。入力内容を確認してください。',
	'event.inferred': '公開実測表にない回数は式で推定しています。',
	'event.targetBelow':
		'目標Ptは現在Pt以上にしてください。Ptを減らす計算には対応していません。',
	'event.unreachable':
		'指定した範囲では完全一致する手順が見つかりませんでした。最大成功回数か最大プレイ数を増やしてください。',
	'event.outOfRange':
		'指定した値が探索可能な範囲を超えています。入力内容を確認してください。',
	'event.invalidInput': '入力値を確認してください。',
	'event.searchLimitExceeded':
		'探索量が上限に達したため、計算を打ち切りました。最大成功回数か最大プレイ数を小さくしてください。',
	'event.errorRequired': '入力が必要です。',
	'event.errorPoint':
		'0以上の整数を入力してください。全角数字とカンマも使用できます。',
	'event.errorBonus': '0以上の割合を、0.1%単位までで入力してください。',
	'event.errorMaxJumps': '0から100までの整数を入力してください。',
	'event.errorMaxRuns': '1から20までの整数を入力してください。',
	'event.formErrorSummary': '入力内容を確認してください。',
	'event.formulaHeading': '計算式',
	'event.formulaIntro': '0ブースト時の獲得Ptには次の式を使います。',
	'event.formulaBase': '基礎Pt = 45 + ceil(13 × 成功回数 ÷ 10)',
	'event.formulaReward':
		'獲得Pt = パスポート倍率 × ceil(基礎Pt × (1000 + ボーナスpermil) ÷ 1000)',
	'event.formulaBoundary':
		'0〜70回、80回、90回、100回は公開実測値と一致します。ほかの回数は同じ式で推定します。',
	'event.source': '実測表',
	'event.serverNote':
		'実際の報酬はゲームサーバーが決定します。このツールは観測値から計算を再現するものです。',
	'event.boostNote': 'ブースト使用時は未対応です。',
	'error.notFoundTitle': 'ページが見つかりません | gaato lab',
	'error.genericTitle': 'エラー | gaato lab',
	'error.notFoundDescription': '指定されたページは見つかりませんでした。',
	'error.genericDescription': 'ページの表示中に問題が発生しました。',
	'error.notFoundHeading': 'ページが見つかりません',
	'error.genericHeading': '問題が発生しました',
	'error.notFoundBody': 'URLを確認するか、ツール一覧へ戻ってください。',
	'error.genericBody': 'しばらくしてから、もう一度お試しください。',
	'error.backHome': 'ツール一覧へ戻る'
} as const;

export type MessageKey = keyof typeof ja;
type Catalog = Record<MessageKey, string>;

const en: Catalog = {
	'site.name': 'gaato lab',
	'site.home': 'All tools',
	'site.language': 'Language',
	'language.ja': '日本語',
	'language.en': 'English',
	'home.title': 'gaato lab',
	'home.description': 'Tools on gaato lab.',
	'home.collection': 'Tools',
	'home.eventPointTitle': 'hololive Dreams: Event Pt calculator',
	'event.title': 'Event Pt adjustment | gaato lab',
	'event.description':
		'Calculate Hoppin Rope runs that reach an exact Event Pt target in hololive Dreams.',
	'event.unofficial':
		'This is an unofficial fan-made tool. It is not affiliated with COVER Corporation or the game operator.',
	'event.heading': 'Event Pt calculator',
	'event.summary': 'Combine Hoppin Rope success counts to reach the target Pt.',
	'event.zeroBoost': '0 Boost',
	'event.formLegend': 'Inputs',
	'event.currentLabel': 'Current Pt',
	'event.targetLabel': 'Target Pt',
	'event.bonusLabel': 'Event bonus',
	'event.bonusUnit': '%',
	'event.bonusHint':
		'Total bonus shown on the team screen. Up to one decimal place.',
	'event.passportLabel': 'Use Holo Passport',
	'event.passportHint': 'Doubles the reward.',
	'event.limitLegend': 'Search limits',
	'event.maxJumpsLabel': 'Maximum successes per run',
	'event.maxJumpsHint': 'Set the highest count you can stop at.',
	'event.maxRunsLabel': 'Maximum runs',
	'event.maxRunsHint': '1–20 runs.',
	'event.calculate': 'Calculate',
	'event.example': 'Load example',
	'event.resultHeading': 'Result',
	'event.emptyBody': 'Enter the inputs, then select Calculate.',
	'event.delta': '{points} Pt remaining',
	'event.planCountOne': '{count} plan found.',
	'event.planCount': '{count} plans found.',
	'event.noPlayHeading': 'You are already at the target',
	'event.noPlayBody': 'No additional runs are needed.',
	'event.planLabel': 'Option {index}',
	'event.playsOne': '{count} run',
	'event.plays': '{count} runs',
	'event.totalJumpsOne': '{count} total success',
	'event.totalJumps': '{count} total successes',
	'event.actionOne': '{jumps} success',
	'event.action': '{jumps} successes',
	'event.actionRepeatedOne': '{jumps} success, {count} times',
	'event.actionRepeated': '{jumps} successes, {count} times',
	'event.actionReward': '{points} Pt per run',
	'event.planReward': '{points} Pt total',
	'event.copyUrl': 'Copy URL',
	'event.copied': 'URL copied.',
	'event.copyFailed':
		'The URL could not be copied. Copy it from your browser address bar.',
	'event.queryIgnored':
		'The URL contains invalid or missing values, so it was not calculated. Check the form values.',
	'event.inferred':
		'Counts not in the published measurements are estimated with the formula.',
	'event.targetBelow':
		'Target Pt must be at least the current Pt. This tool cannot reduce your total.',
	'event.unreachable':
		'No exact plan was found within these limits. Increase the maximum successes or maximum runs.',
	'event.outOfRange':
		'A value is outside the supported search range. Check your inputs.',
	'event.invalidInput': 'Check the input values.',
	'event.searchLimitExceeded':
		'The search reached its work limit and stopped. Reduce the maximum successes or maximum runs.',
	'event.errorRequired': 'This field is required.',
	'event.errorPoint':
		'Enter a whole number of 0 or more. Full-width digits and commas are accepted.',
	'event.errorBonus':
		'Enter a percentage of 0 or more, with at most one decimal place.',
	'event.errorMaxJumps': 'Enter a whole number from 0 to 100.',
	'event.errorMaxRuns': 'Enter a whole number from 1 to 20.',
	'event.formErrorSummary': 'Check the highlighted fields.',
	'event.formulaHeading': 'Formula',
	'event.formulaIntro': '0 Boost rewards use the following formula.',
	'event.formulaBase': 'Base Pt = 45 + ceil(13 × successes ÷ 10)',
	'event.formulaReward':
		'Reward Pt = Passport factor × ceil(Base Pt × (1000 + bonus permil) ÷ 1000)',
	'event.formulaBoundary':
		'The formula matches published measurements for 0–70, 80, 90, and 100 successes. Other counts are estimates.',
	'event.source': 'Measurements',
	'event.serverNote':
		'The game server decides the actual reward. This tool reconstructs the calculation from observed values.',
	'event.boostNote': 'Event Pt Boost is not supported.',
	'error.notFoundTitle': 'Page not found | gaato lab',
	'error.genericTitle': 'Error | gaato lab',
	'error.notFoundDescription': 'The requested page could not be found.',
	'error.genericDescription': 'A problem occurred while displaying this page.',
	'error.notFoundHeading': 'Page not found',
	'error.genericHeading': 'Something went wrong',
	'error.notFoundBody': 'Check the URL or return to the tool list.',
	'error.genericBody': 'Please wait a moment and try again.',
	'error.backHome': 'Back to all tools'
};

export const catalogs: Record<Locale, Catalog> = { ja, en };
export const locale = writable<Locale>(defaultLocale);

export function isLocale(value: string | null | undefined): value is Locale {
	return supportedLocales.includes(value as Locale);
}

export function localeFromLanguageTag(
	language: string | null | undefined
): Locale | null {
	if (!language) return null;
	const primary = language.trim().toLowerCase().split('-')[0];
	return isLocale(primary) ? primary : null;
}

export function resolveLocale(
	queryLanguage: string | null,
	storedLanguage: string | null,
	navigatorLanguages: readonly string[]
): Locale {
	if (isLocale(queryLanguage)) return queryLanguage;
	if (isLocale(storedLanguage)) return storedLanguage;

	for (const language of navigatorLanguages) {
		const candidate = localeFromLanguageTag(language);
		if (candidate) return candidate;
	}

	return defaultLocale;
}

export function translate(
	activeLocale: Locale,
	key: MessageKey,
	parameters: Record<string, string | number | bigint> = {}
): string {
	return catalogs[activeLocale][key].replace(
		/\{(\w+)\}/g,
		(match, parameter: string) =>
			parameter in parameters ? String(parameters[parameter]) : match
	);
}

export function formatInteger(
	activeLocale: Locale,
	value: bigint | number
): string {
	return new Intl.NumberFormat(activeLocale === 'ja' ? 'ja-JP' : 'en-US', {
		maximumFractionDigits: 0
	}).format(value);
}
