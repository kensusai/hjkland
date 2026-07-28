# デザインモック

**確定版(実装の仕様)は hjkland テーマ**: `rebrand-hjkland.html`(ホーム)/ `rebrand-hjkland-practice.html`(演習・案A: エディタのみダーク)。トーンは「明るいテーマパーク × ピクセルポップ」。

- `rebrand-heavy-modal.html` / `rebrand-motion-pit.html` / `rebrand-visual-kei.html` — リブランド検討時の比較案。**不採用**。経緯として残す。
- 道場時代の旧モック(home*.html / practice*.html)は 2026-07-28 に削除(履歴は git にある)。

デザイントークンは各ファイルの `:root` に定義。実装時は hjkland テーマのトークンを正とする(`src/ui/index.css` と同期)。

判定の用語: 金メダル=「パーフェクトライド!!」、銀=「ナイスライド!」、銅=「完走」(メダル自体の呼称は金/銀/銅のまま)。

## Figma への取り込み(必要になったら)

1. Figma でファイルを開く → メニュー → Plugins → **html.to.design** を実行(未導入なら Community から入手)。
2. プラグインの **Paste code**(HTMLコード貼り付け)を選び、モック HTML の中身を全文貼り付けて Import する。
3. 編集可能なレイヤーとして展開されるので、以降の微調整は Figma 側で行う。
4. Figma 側で確定した変更は、モック HTML(と実装があれば実装)に反映してコードとデザインの対応を保つ。

モックは html.to.design 互換ルール(外部リソースゼロ・静的DOM・システムフォント・`:root` トークン定義)で作ってあるため、そのまま取り込める。詳細な規約は `skills/design-mockup/SKILL.md` を参照。
