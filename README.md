# gaato lab

小さな計算機や実験的なWebツールを公開するためのサイトです。最初のツールとして、hololive DreamsのイベントPtを狙った値へ合わせるための計算機を収録しています。

このサイトは非公式のファンメイドツールです。カバー株式会社およびhololive Dreamsの開発・運営元とは関係ありません。公式画像やゲーム内アセットは使用していません。

## ページ

- `/` — ツール一覧
- `/event-point/` — イベントPt調整ツール

イベントPt調整ツールは日本語と英語に対応し、入力条件と言語をURLで共有できます。v0.1は0ブーストでの完全一致だけを対象にしています。

## 計算式

縄跳びの成功回数を `n`、イベントボーナスをpermil単位で `q`、ホロパスポート倍率を `h`（未所持なら1、所持なら2）とすると、獲得Ptを次のように復元します。

```text
base(n)   = 45 + ceil(13n / 10)
reward(n) = h * ceil(base(n) * (1000 + q) / 1000)
```

基礎式は[公開されている実測表](https://forum.gamer.com.tw/C.php?bsn=84454&last=1&snA=600&tnum=1)の0〜70回、80回、90回、100回の各行に一致します。また、別のユーザーアカウントで観測した0回、43回、49回、50回の値とも一致します。ただし、固定値45を含む完全な計算式は配信マスターから確認できていません。これは公開値と手元の観測値から推定した式です。

- 0〜70回、80回、90回、100回：公開実測表に記載あり
- 71〜99回のうち上記以外：同じ式から算出した推定値
- v0.1の探索範囲：1プレイあたり0〜100回
- 1ブースト以上：v0.1の対象外

計算機はこの境界を画面にも表示します。ゲームの更新によって結果が変わる可能性があるため、重要な調整では事前に少ない回数で確認してください。

完全一致する候補は、プレイ数、1プレイの最大成功回数、成功回数の合計、成功回数列の順で小さいものを最大3件表示します。大きすぎる組み合わせ探索はブラウザ停止を避けるため打ち切り、その場合は探索範囲を狭めるよう案内します。

## 開発

Node.js 24とBun 1.3を使用します。miseを使う場合はリポジトリ内の設定が適用されます。

```fish
bun install
bun run dev
```

一括検証とローカルプレビューは次の通りです。

```fish
bun run verify
bunx wrangler dev --local --ip 127.0.0.1 --port 4173
```

別のターミナルから、アクセシビリティとsmoke testを実行できます。

```fish
set -lx SITE_URL http://127.0.0.1:4173
bunx pa11y-ci
bun run smoke
bun run smoke:browser
```

## 翻訳とテーマ

- 翻訳を追加・変更するときは、すべてのロケールで同じメッセージキーを揃えます。
- 表示上の数値は`Intl.NumberFormat`でローカライズし、共有URLにはロケール非依存の値を保存します。
- daisyUIのライト／ダークテーマはサイト固有の色トークンとして管理します。公式ゲーム画面を模倣する色やアセットは追加しません。
- 新しい言語を追加したら、言語選択、`<html lang>`、ページメタデータ、クエリ文字列からの復元をテストします。

## Cloudflareへの公開

静的ビルドは`build/`へ出力され、Cloudflare Workers Static Assetsで配信されます。Pull Requestと`main`以外の手動実行では検証だけを行い、`main`へのpushまたは`main`からの手動実行で検証後にWorkerをデプロイします。

GitHubリポジトリには次の設定が必要です。

- Actions secret: `CLOUDFLARE_API_TOKEN`
- Actions variable（任意）: `PRODUCTION_URL`。設定した場合だけ、デプロイ後に本番URLのsmoke testを行います。

Cloudflare account IDは秘密情報ではないため、既存サイトと同じ値をWorkflowに明示しています。

初回公開は次の順序で行います。

1. このリポジトリのActions設定へtokenを登録する。
2. `main`のWorkflowで`lab-gaato-net` Workerを作成する。
3. IACリポジトリへ`cloudflare_workers_custom_domain`による`lab.gaato.net`の割り当てを追加する。
4. IACの`fmt`、`validate`、`plan`を確認する。
5. 変更をmergeし、既存のOpenTofu apply Workflowへmerge済みSHAを渡す。
6. `/`、`/event-point/`、存在しないURLの404を本番で確認する。

Workerが存在する前にCustom Domainを適用しないでください。DNSレコードやWorker Routeを別途重複作成する必要はありません。

## ライセンス

[Blue Oak Model License 1.0.0](./LICENSE)
