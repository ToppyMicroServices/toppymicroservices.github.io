# Quiz Template (JA/EN)

このテンプレートは、`education/quiz_template.html` をコピーして、任意テーマのクイズページを素早く作成するためのガイドです。既存の金融用語クイズ（JP/EN）と同じUI/UX・機能（学習モード、結果集計、常時スコア、ドラッグ&ドロップ分類、簡易チャート選択）を使えます。

## 使い方（最短）

1) `education/quiz_template.html` をコピー

- 例: `education/quiz_my_topic.html`

2) ページ上部の `DRILL_SETTINGS` を編集

- `SKILL_NAME`（スキル名/テーマ名）
- `SKILL_SUBTITLE`（サブタイトル）
- `GOAL_DESCRIPTION`（ゴールの一文）
- `LEARNING_MODE_DEFAULT`（true/false）

任意（ブランド要素）

- `BRAND_NAME`（社名/サイト名）
- `BRAND_LOGO`（相対パス。例: `og-brand-clean.min.png`）
- `BRAND_URL`（ブランドのリンク先。例: `../index.html`）

3) 「Cheat Sheet」中身を書き換え（任意）

- `<details class="cheatsheet">` の `.sheet` 内を編集

4) `#questions` に設問を追加

- 最低1問、`<article class="q card" ...>` をコピーして増やしてください。
- `data-id` を `Q1`, `Q2`... と一意に振る。
- `data-type` と `data-answer` を設定（下記参照）。

5) 動作確認し、必要に応じてリンク（言語切替など）を調整

## 設問タイプと属性

共通: `data-id="Qn"`（一意）

- Multiple Choice（単一）
  - `data-type="mc"`
  - `data-answer="b"`（正答のキー）
  - 選択肢は `<label class="choice"><input type="radio" name="Qn" value="a"> A. ...</label>` のように a,b,c...

- Multi Select（複数）
  - `data-type="ms"`
  - `data-answer="a,c"`（カンマ区切り）
  - `<input type="checkbox" ... value="a">`

- Short Text（テキスト: 厳密一致 or 正規表現）
  - `data-type="text"`
  - 厳密一致: `data-answer="answer"`, `data-eval="exact"`（省略可）
  - 正規表現: `data-eval="regex"`

- Classify（ドラッグ&ドロップ分類）
  - `data-type="classify"`
  - `data-answer="stock:a,c;flow:b,d"` のように「グループ:キー一覧;」の形式
  - `.bucket` に `data-group="stock"` などの受け側コンテナを用意、`.chip` がドラッグ要素

- Segment（チャートの期間選択）
  - `data-type="segment"`
  - `data-answer="2"`（選択インデックス）
  - `.mini-chart`+`.segments` の雛形を流用

## 解説（リッチ）を増やす

- ページ末尾の `CHOICE_EXPLANATIONS` と `DETAIL_NOTES` に、各 `Qn` の内容（選択肢ごとの理由、背景ノート）を追記すると、
  初回表示時に自動注入されます。
- 小図（SVG）サンプル（Stock vs Flow / Credit spread）は Q1/Q10 用の例です。他Qにも追加可能です。

## 言語切替

- テンプレートには言語トグルのUIは含めています（相対パスリンク）。
- 同一ページで切替したい場合は、リンクをボタンに変え、`translatePage('en'|'ja')` を呼ぶ実装に変えるだけでOKです。
