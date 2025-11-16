# Quiz Template (JA/EN)

このテンプレートは、`education/quiz_template_skeleton.html` をコピーして、任意テーマのクイズページを素早く作成するためのガイドです。既存のクイズと同じコアのUI/UX・機能（学習モード、結果集計テーブル、常時スコア）を使えます。

## 使い方（最短）

1. `education/quiz_template_skeleton.html` をコピー

   - 例: `education/quiz_my_topic.html`

2. ページ上部の `DRILL_SETTINGS` を編集（ブランド関連は固定）

   - `SKILL_NAME`（スキル名/テーマ名）
   - `SKILL_SUBTITLE`（サブタイトル）
   - `GOAL_DESCRIPTION`（ゴールの一文）
   - `LEARNING_MODE_DEFAULT`（true/false）

   注: ブランド関連キー（`BRAND_NAME`, `BRAND_LOGO`, `BRAND_URL`）は運用方針として `ToppyMicroServices` 固定です。テンプレートに残っていても変更しないでください。不要なら新規ページ作成時に削除しても動作に支障はありません。


3. 「Cheat Sheet」中身を書き換え（任意）

   - `<details class="cheatsheet">` の `.sheet` 内を編集

4. `#questions` に設問を追加

   - 最低1問、`<article class="q card" ...>` をコピーして増やしてください。
   - `data-id` を `Q1`, `Q2`... と一意に振る。
   - `data-type` と `data-answer` を設定（下記参照）。

5. 動作確認し、必要に応じてリンク（言語切替など）を調整

## 設問タイプと属性

共通: `data-id="Qn"`（一意）

- **Multiple Choice（単一選択）**
  - `data-type="mc"`
  - `data-answer="b"`（正答のキー）
  - 選択肢は `<label class="choice"><input type="radio" name="Qn" value="a"> A. ...</label>` のように a,b,c...

- **Multi Select（複数選択）**
  - `data-type="ms"`
  - `data-answer="a,c"`（カンマ区切り）
  - `<input type="checkbox" ... value="a">`

- **Short Text（テキスト: 厳密一致 or 正規表現）**
  - `data-type="text"`
  - 厳密一致: `data-answer="answer"`, `data-eval="exact"`（省略可）
  - 正規表現: `data-eval="regex"`

## 解説（リッチ）を増やす

- 各 `<article class="q card" ...>` 内の `<div class="explain">...</div>` に、設問ごとの補足説明・根拠などを記述できます。
- 「回答を表示」後の結果テーブルには、この `.explain` の内容が設問ごとの解説として反映されます。

## 言語切替

- `quiz_template_skeleton.html` 自体は単一言語前提です（`<html lang="en">`）。
- 日本語版/英語版をペアで作る場合は、`quiz_finance_terms.html` / `quiz_finance_terms_en.html` のようにファイルを分け、ヘッダーに言語切替リンクを追加する形を推奨します。
