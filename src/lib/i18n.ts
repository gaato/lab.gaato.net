import { writable } from 'svelte/store';

export const supportedLocales = ['ja', 'en'] as const;
export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'ja';
export const localeStorageKey = 'lab.gaato.net.locale';

const ja = {
	'site.name': 'gaato lab',
	'site.home': 'ツール一覧',
	'site.holodori': 'ホロドリ',
	'site.breadcrumbs': 'パンくずリスト',
	'site.language': '言語',
	'site.shareTool': 'このツールを共有',
	'site.shareCopied': 'URLをコピーしました。',
	'site.shareFailed':
		'URLを共有できませんでした。ブラウザのアドレス欄からコピーしてください。',
	'language.ja': '日本語',
	'language.en': 'English',
	'home.title': 'gaato lab',
	'home.description': 'gaato labのツール一覧。',
	'home.collection': 'ツール',
	'home.eventPointTitle': 'ホロドリ：イベントPt調整',
	'home.highLowTitle': 'ホロドリ：ハイ&ロー手札判断',
	'holodori.title': 'ホロドリ | gaato lab',
	'holodori.description': 'ホロドリのツール一覧。',
	'holodori.collection': 'ホロドリ',
	'holodori.unofficial':
		'非公式のファンメイドツールです。カバー株式会社およびゲーム運営元とは関係ありません。',
	'event.title': 'ホロドリ：イベントPt調整 | gaato lab',
	'event.description':
		'ホロライブ ドリームスのイベントPtを、ホッピンロープで目標値に合わせる手順を計算します。',
	'event.unofficial':
		'非公式のファンメイドツールです。カバー株式会社およびゲーム運営元とは関係ありません。',
	'event.heading': 'ホロドリ：イベントPt調整',
	'event.summary':
		'ホッピンロープの成功回数を組み合わせて、目標Ptに合わせます。イベントPtブースト使用時は未対応です。',
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
	'event.formulaIntro':
		'イベントPtブーストを使用しない場合の獲得Ptには次の式を使います。',
	'event.formulaBase': '基礎Pt = 45 + ceil(13 × 成功回数 ÷ 10)',
	'event.formulaReward':
		'獲得Pt = パスポート倍率 × ceil(基礎Pt × (1000 + ボーナスpermil) ÷ 1000)',
	'event.formulaBoundary':
		'0〜70回、80回、90回、100回は公開実測値と一致します。ほかの回数は同じ式で推定します。',
	'event.source': '実測表',
	'event.serverNote':
		'実際の報酬はゲームサーバーが決定します。このツールは観測値から計算を再現するものです。',
	'event.boostNote': 'イベントPtブースト使用時は未対応です。',
	'highLow.title': 'ホロドリ：ハイ&ロー手札判断 | gaato lab',
	'highLow.description':
		'カードオブグリードの5枚から、残すカードを計算します。',
	'highLow.heading': 'ホロドリ：ハイ&ロー手札判断',
	'highLow.summary':
		'カードオブグリードの5枚を入力すると、残すカードを計算します。',
	'highLow.handLegend': '手札',
	'highLow.cardSlot': '{index}枚目',
	'highLow.emptyCard': '未選択',
	'highLow.activeCard': '選択中',
	'highLow.rankLegend': '数字',
	'highLow.suitLegend': 'スート',
	'highLow.joker': 'JOKER',
	'highLow.clearCard': 'このカードを消す',
	'highLow.clearAll': 'すべて消す',
	'highLow.duplicateCard': 'そのカードはすでに選ばれています。',
	'highLow.resultHeading': 'おすすめ',
	'highLow.waiting': '5枚を選んでください。',
	'highLow.waitingCount': 'あと{count}枚',
	'highLow.calculating': '計算中',
	'highLow.analysisError':
		'計算できませんでした。もう一度カードを選び直してください。',
	'highLow.keep': '残す',
	'highLow.replace': '入れ替え',
	'highLow.keepCount': '{count}枚を残す',
	'highLow.replaceAll': 'すべて入れ替え',
	'highLow.tied': '同率の候補が{count}通りあります。',
	'highLow.totalExpected': '総合期待払い戻し',
	'highLow.totalExpectedHint': 'High & Lowを含む1ゲームの期待値',
	'highLow.hitRate': '役成立率',
	'highLow.coins': '{value}コイン',
	'highLow.detailsHeading': '詳細',
	'highLow.pokerExpected': 'ポーカー直後の期待払い戻し',
	'highLow.distribution': '役の分布',
	'highLow.handType': '役',
	'highLow.probability': '確率',
	'highLow.alternatives': '次の候補',
	'highLow.difference': '1位との差 {value}コイン',
	'highLow.methodHeading': '計算について',
	'highLow.methodIntro':
		'53枚のデッキから、全32通りの残し方と交換後の手札を比較しています。',
	'highLow.methodHighLow':
		'おすすめは、High & Lowで降りるタイミングまで最適化した期待払い戻し順です。',
	'highLow.methodLimit':
		'10,000コインからもう1回挑戦でき、10,000超で終了する条件は含みます。1日20,000コイン上限は含みません。',
	'highLow.methodVersion': 'Ver.1.0.100の配当を使用しています。',
	'highLow.source': 'Ver.1.0.100更新内容',
	'highLow.hand.none': '役なし',
	'highLow.hand.onePair': 'ワンペア',
	'highLow.hand.twoPair': 'ツーペア',
	'highLow.hand.threeCard': 'スリーカード',
	'highLow.hand.straight': 'ストレート',
	'highLow.hand.flush': 'フラッシュ',
	'highLow.hand.fullHouse': 'フルハウス',
	'highLow.hand.fourCard': 'フォーカード',
	'highLow.hand.straightFlush': 'ストレートフラッシュ',
	'highLow.hand.royalStraightFlush': 'ロイヤルフラッシュ',
	'highLow.hand.fiveCard': 'ファイブカード',
	'highLow.suit.spade': 'スペード',
	'highLow.suit.heart': 'ハート',
	'highLow.suit.diamond': 'ダイヤ',
	'highLow.suit.club': 'クラブ',
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
	'site.holodori': 'hololive Dreams',
	'site.breadcrumbs': 'Breadcrumb',
	'site.language': 'Language',
	'site.shareTool': 'Share this tool',
	'site.shareCopied': 'URL copied.',
	'site.shareFailed':
		'The URL could not be shared. Copy it from your browser address bar.',
	'language.ja': '日本語',
	'language.en': 'English',
	'home.title': 'gaato lab',
	'home.description': 'Tools on gaato lab.',
	'home.collection': 'Tools',
	'home.eventPointTitle': 'hololive Dreams: Event Pt calculator',
	'home.highLowTitle': 'hololive Dreams: High & Low hand advisor',
	'holodori.title': 'hololive Dreams | gaato lab',
	'holodori.description': 'Tools for hololive Dreams.',
	'holodori.collection': 'hololive Dreams',
	'holodori.unofficial':
		'These are unofficial fan-made tools. They are not affiliated with COVER Corporation or the game operator.',
	'event.title': 'hololive Dreams: Event Pt calculator | gaato lab',
	'event.description':
		'Calculate Hoppin Rope runs that reach an exact Event Pt target in hololive Dreams.',
	'event.unofficial':
		'This is an unofficial fan-made tool. It is not affiliated with COVER Corporation or the game operator.',
	'event.heading': 'hololive Dreams: Event Pt calculator',
	'event.summary':
		'Combine Hoppin Rope success counts to reach the target Pt. Event Pt Boost is not supported.',
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
	'event.maxRunsHint': '1-20 runs.',
	'event.calculate': 'Calculate',
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
	'event.formulaIntro':
		'Rewards without Event Pt Boost use the following formula.',
	'event.formulaBase': 'Base Pt = 45 + ceil(13 × successes ÷ 10)',
	'event.formulaReward':
		'Reward Pt = Passport factor × ceil(Base Pt × (1000 + bonus permil) ÷ 1000)',
	'event.formulaBoundary':
		'The formula matches published measurements for 0-70, 80, 90, and 100 successes. Other counts are estimates.',
	'event.source': 'Measurements',
	'event.serverNote':
		'The game server decides the actual reward. This tool reconstructs the calculation from observed values.',
	'event.boostNote': 'Event Pt Boost is not supported.',
	'highLow.title': 'hololive Dreams: High & Low hand advisor | gaato lab',
	'highLow.description':
		'Choose the five Card of Greed cards to calculate which cards to keep.',
	'highLow.heading': 'hololive Dreams: High & Low hand advisor',
	'highLow.summary':
		'Choose your five Card of Greed cards to calculate which ones to keep.',
	'highLow.handLegend': 'Hand',
	'highLow.cardSlot': 'Card {index}',
	'highLow.emptyCard': 'Not selected',
	'highLow.activeCard': 'Selected',
	'highLow.rankLegend': 'Rank',
	'highLow.suitLegend': 'Suit',
	'highLow.joker': 'JOKER',
	'highLow.clearCard': 'Clear this card',
	'highLow.clearAll': 'Clear all',
	'highLow.duplicateCard': 'That card is already in your hand.',
	'highLow.resultHeading': 'Recommendation',
	'highLow.waiting': 'Choose five cards.',
	'highLow.waitingCount': '{count} remaining',
	'highLow.calculating': 'Calculating',
	'highLow.analysisError':
		'The hand could not be calculated. Select the cards again.',
	'highLow.keep': 'Keep',
	'highLow.replace': 'Replace',
	'highLow.keepCount': 'Keep {count}',
	'highLow.replaceAll': 'Replace all',
	'highLow.tied': '{count} strategies are tied.',
	'highLow.totalExpected': 'Expected total payout',
	'highLow.totalExpectedHint':
		'Expected payout for one game including High & Low',
	'highLow.hitRate': 'Winning-hand rate',
	'highLow.coins': '{value} coins',
	'highLow.detailsHeading': 'Details',
	'highLow.pokerExpected': 'Expected payout before High & Low',
	'highLow.distribution': 'Hand distribution',
	'highLow.handType': 'Hand',
	'highLow.probability': 'Probability',
	'highLow.alternatives': 'Next strategies',
	'highLow.difference': '{value} coins below first place',
	'highLow.methodHeading': 'Calculation',
	'highLow.methodIntro':
		'The calculator compares all 32 hold choices and every possible final hand from a 53-card deck.',
	'highLow.methodHighLow':
		'Recommendations are ranked by expected payout with an optimal stopping strategy for High & Low.',
	'highLow.methodLimit':
		'The calculation allows one more round at 10,000 coins and stops above 10,000. The 20,000-coin daily limit is not included.',
	'highLow.methodVersion': 'Uses the payout table from version 1.0.100.',
	'highLow.source': 'Version 1.0.100 update notes',
	'highLow.hand.none': 'No hand',
	'highLow.hand.onePair': 'One Pair',
	'highLow.hand.twoPair': 'Two Pair',
	'highLow.hand.threeCard': 'Three Card',
	'highLow.hand.straight': 'Straight',
	'highLow.hand.flush': 'Flush',
	'highLow.hand.fullHouse': 'Full House',
	'highLow.hand.fourCard': 'Four Card',
	'highLow.hand.straightFlush': 'Straight Flush',
	'highLow.hand.royalStraightFlush': 'Royal Flush',
	'highLow.hand.fiveCard': 'Five Card',
	'highLow.suit.spade': 'Spades',
	'highLow.suit.heart': 'Hearts',
	'highLow.suit.diamond': 'Diamonds',
	'highLow.suit.club': 'Clubs',
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
