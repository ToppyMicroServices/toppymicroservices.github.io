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

## クイズ作成ポリシー（必須）

このクイズは「資格試験対策」や「暗記」を目的にしません。AIが全盛となる状況で、エンジニアがAIを使って関連テーマを扱う際に、**前提として知っておくべき内容**を整理し、スキルを磨くための手段を提供します。

### 出題ポリシー

- **コマンド/オプションの暗記を主目的にしない**（AIに任せれば済む）。
- 代わりに、AIの回答に含まれる語や概念を正しく解釈できるようにするため、以下を問う:
   - **コンセプト** / **設計思想** / **思考フレーム**
   - **キーワード**と意味、使われる**メトリック**の意味
   - **よくある誤解**、典型的な**エラー/失敗**、安全な判断基準
- URLやテーマの追加があった場合は **10問**。
- 大きいテーマは **25問**。

### 解説ポリシー

解説は「読むことで学習できる」ことを最優先にし、単なる答え合わせにしません。

- 解説には最低限、以下を含める:
   1. 問われている内容の説明（定義/前提）
   2. 出題の意図（**問題を出した背景**）
   3. 重要な点（覚えるべきもの、誤解しやすい点）
- 特に記憶すべきキーワードは **太字** にする。
- 次に、各選択肢（または各入力パターン）への回答を**丁寧に**解説する。
   - 解説を**1行で追えない**こと（短すぎる断定で終わらない）。
- 問題/解説領域は、テンプレのMarkdown処理（例: `**bold**`, `` `code` ``）が適切に反映される前提で書く。
   - 使う記法は、テンプレが処理できる範囲に留め、HTMLを壊す書き方は避ける。

## 言語切替

- `quiz_template_skeleton.html` 自体は単一言語前提です（`<html lang="en">`）。
- 日本語版/英語版をペアで作る場合は、`quiz_finance_terms.html` / `quiz_finance_terms_en.html` のようにファイルを分け、ヘッダーに言語切替リンクを追加する形を推奨します。
