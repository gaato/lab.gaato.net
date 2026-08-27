import { writable } from 'svelte/store';

export const supportedLocales = ['ja', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'ja';
export const localeStorageKey = 'lab.gaato.net.locale';

const ja = {
	'site.name': 'gaato lab',
	'site.home': 'ツール一覧',
	'site.language': '言語',
	'site.unofficial':
		'非公式のファンメイドツールです。カバー株式会社およびゲーム運営元とは関係ありません。',
	'language.ja': '日本語',
	'language.en': 'English',
	'home.title': 'gaato lab | 小さな実験道具',
	'home.description':
		'計算機や検証道具など、小さな成果物を公開するための実験室です。',
	'home.kicker': 'GAATO LAB',
	'home.heading': '小さな実験を、使える形に。',
	'home.lead': '計算機や検証道具を、ブラウザですぐ使える形で公開しています。',
	'home.collection': '公開中のツール',
	'home.collectionHint': '今後、同じ場所に小さなツールを追加していきます。',
	'home.eventPointTitle': 'イベントPt調整',
	'home.eventPointDescription':
		'現在Ptから目標Ptまで、ホッピンロープを何回成功させればよいかを計算します。',
	'home.openTool': '計算機を開く',
	'event.title': 'イベントPt調整 | gaato lab',
	'event.description':
		'ホロライブ ドリームスのイベントPtを、ホッピンロープで目標値に合わせる手順を計算します。',
	'event.kicker': 'HOLOLIVE DREAMS',
	'event.heading': 'イベントPtをぴったり合わせる',
	'event.lead': '現在Ptと目標Ptから、ホッピンロープの成功回数を逆算します。',
	'event.zeroBoost': '0ブースト専用',
	'event.formLegend': '計算条件',
	'event.currentLabel': '現在Pt',
	'event.currentHint': 'いま所持しているイベントPtを入力します。',
	'event.targetLabel': '目標Pt',
	'event.targetHint': '完全一致させたいイベントPtを入力します。',
	'event.bonusLabel': 'イベントボーナス',
	'event.bonusUnit': '%',
	'event.bonusHint':
		'編成画面に表示される合計ボーナス率です。0.1%単位で入力できます。',
	'event.passportLabel': 'ホロパスポートを使用',
	'event.passportHint': '獲得Ptが2倍になる場合にオンにします。',
	'event.limitLegend': '探索範囲',
	'event.maxJumpsLabel': '1プレイの最大成功回数',
	'event.maxJumpsHint':
		'無理なく狙える回数に絞ると、実行しやすい案を優先できます。',
	'event.maxRunsLabel': '最大プレイ数',
	'event.maxRunsHint': '1から20プレイまで探索できます。',
	'event.calculate': '完全一致する手順を探す',
	'event.example': '実測例を入力',
	'event.resultHeading': '計算結果',
	'event.emptyHeading': '条件を入力してください',
	'event.emptyBody':
		'現在Ptと目標Ptを入力すると、ここに完全一致する手順が表示されます。',
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
	'event.shareX': 'Xで共有',
	'event.shareText': 'イベントPtを{target}に合わせる手順を計算しました。',
	'event.queryIgnored':
		'URL内の値が無効または不足しているため、計算には使用していません。入力内容を確認してください。',
	'event.inferred':
		'この手順には公開実測表にない成功回数が含まれるため、式から推定した獲得Ptを使用しています。',
	'event.targetBelow':
		'目標Ptは現在Pt以上にしてください。Ptを減らす計算には対応していません。',
	'event.unreachable':
		'指定した範囲では完全一致する手順が見つかりませんでした。最大成功回数か最大プレイ数を増やしてください。',
	'event.outOfRange':
		'指定した値が探索可能な範囲を超えています。入力内容を確認してください。',
	'event.invalidInput':
		'入力値の型が正しくありません。入力内容を確認してください。',
	'event.searchLimitExceeded':
		'探索量が上限に達したため、計算を打ち切りました。最大成功回数か最大プレイ数を小さくしてください。',
	'event.errorRequired': '入力が必要です。',
	'event.errorPoint':
		'0以上の整数を入力してください。全角数字とカンマも使用できます。',
	'event.errorBonus': '0以上の割合を、0.1%単位までで入力してください。',
	'event.errorMaxJumps': '0から100までの整数を入力してください。',
	'event.errorMaxRuns': '1から20までの整数を入力してください。',
	'event.formErrorSummary': '入力内容を確認してください。',
	'event.formulaHeading': '計算方法と精度',
	'event.formulaIntro':
		'0ブースト時の獲得Ptを、公開実測値から復元した次の式で計算します。',
	'event.formulaBase': '基礎Pt = 45 + ceil(13 × 成功回数 ÷ 10)',
	'event.formulaReward':
		'獲得Pt = パスポート倍率 × ceil(基礎Pt × (1000 + ボーナスpermil) ÷ 1000)',
	'event.formulaBoundary':
		'公開実測表の0回から70回、80回、90回、100回と手元の測定値に一致します。それ以外の回数は同じ式による推定です。',
	'event.source': '公開実測表を見る',
	'event.serverNote':
		'実際の報酬はゲームサーバーが決定します。このツールは観測値から計算を再現するものです。',
	'event.boostNote': 'イベントPtブーストを使用した計算には対応していません。',
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
	'site.unofficial':
		'This is an unofficial fan-made tool. It is not affiliated with COVER Corporation or the game operator.',
	'language.ja': '日本語',
	'language.en': 'English',
	'home.title': 'gaato lab | Small experimental tools',
	'home.description':
		'A home for small calculators, research utilities, and browser experiments.',
	'home.kicker': 'GAATO LAB',
	'home.heading': 'Small experiments, made useful.',
	'home.lead':
		'A growing collection of calculators and research utilities that run in your browser.',
	'home.collection': 'Available tools',
	'home.collectionHint': 'More small tools will be added here over time.',
	'home.eventPointTitle': 'Event Pt adjustment',
	'home.eventPointDescription':
		'Calculate how many Hoppin Rope successes you need to reach an exact Event Pt target.',
	'home.openTool': 'Open calculator',
	'event.title': 'Event Pt adjustment | gaato lab',
	'event.description':
		'Calculate Hoppin Rope runs that reach an exact Event Pt target in hololive Dreams.',
	'event.kicker': 'HOLOLIVE DREAMS',
	'event.heading': 'Hit your exact Event Pt target',
	'event.lead':
		'Work backward from your current and target totals to a set of Hoppin Rope runs.',
	'event.zeroBoost': '0 Boost only',
	'event.formLegend': 'Calculation settings',
	'event.currentLabel': 'Current Pt',
	'event.currentHint': 'Enter the Event Pt you have now.',
	'event.targetLabel': 'Target Pt',
	'event.targetHint': 'Enter the exact Event Pt total you want to reach.',
	'event.bonusLabel': 'Event bonus',
	'event.bonusUnit': '%',
	'event.bonusHint':
		'Use the total bonus shown on the team screen. Decimals to 0.1% are supported.',
	'event.passportLabel': 'Use Holo Passport',
	'event.passportHint': 'Turn this on when your Event Pt reward is doubled.',
	'event.limitLegend': 'Search limits',
	'event.maxJumpsLabel': 'Maximum successes per run',
	'event.maxJumpsHint':
		'Set a count you can reliably stop at to prioritize practical plans.',
	'event.maxRunsLabel': 'Maximum runs',
	'event.maxRunsHint': 'Search between 1 and 20 runs.',
	'event.calculate': 'Find an exact plan',
	'event.example': 'Load measured example',
	'event.resultHeading': 'Result',
	'event.emptyHeading': 'Enter your conditions',
	'event.emptyBody':
		'Enter current and target Pt to see plans that reach the target exactly.',
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
	'event.shareX': 'Share on X',
	'event.shareText': 'I calculated a plan to reach {target} Event Pt.',
	'event.queryIgnored':
		'The URL contains invalid or missing values, so it was not calculated. Check the form values.',
	'event.inferred':
		'This plan contains a success count not listed in the public measurements, so its reward is inferred from the formula.',
	'event.targetBelow':
		'Target Pt must be at least the current Pt. This tool cannot reduce your total.',
	'event.unreachable':
		'No exact plan was found within these limits. Increase the maximum successes or maximum runs.',
	'event.outOfRange':
		'A value is outside the supported search range. Check your inputs.',
	'event.invalidInput': 'An input has the wrong type. Check your inputs.',
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
	'event.formulaHeading': 'Formula and accuracy',
	'event.formulaIntro':
		'At 0 Boost, Event Pt is calculated with this formula reconstructed from published measurements.',
	'event.formulaBase': 'Base Pt = 45 + ceil(13 × successes ÷ 10)',
	'event.formulaReward':
		'Reward Pt = Passport factor × ceil(Base Pt × (1000 + bonus permil) ÷ 1000)',
	'event.formulaBoundary':
		'The formula matches published measurements for 0 through 70, plus 80, 90, and 100 successes, as well as our own measurements. Other counts are inferred from the same formula.',
	'event.source': 'View the public measurement table',
	'event.serverNote':
		'The game server decides the actual reward. This tool reconstructs the calculation from observed values.',
	'event.boostNote': 'Calculations with Event Pt Boost are not supported.',
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
