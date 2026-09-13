# Maintenance mode

## 現在の機能

- サイドバーの「管理画面」から登録文書一覧を表示
- ファイル名、容量、ページ数、チャンク数、登録日を確認
- R2へ保存したPDFをブラウザ内ビューアで閲覧
- PDF原本はR2の公開URLへ出さず、Workerの読み取りAPIから取得
- 現在のサンプル文書は `demo-expense`、`demo-assets`、`demo-attendance` の固定IDで表示
- ポートフォリオ公開用の読み取り専用画面。追加、修正、削除、再読込は提供しない

## 保存と閲覧

```text
管理画面
  ↓ GET
Next.js Route Handler
  ↓
Cloudflare R2 (private bucket)
  ↓ blob
ブラウザ内PDF viewer
```

R2バケットは `local-rag-document-assistant-documents`、Worker側のバインディングは `DOCUMENTS` です。現在のサンプルPDFは `documents/demo-expense`、`documents/demo-assets`、`documents/demo-attendance` と各`pages/1`から`pages/5`へ保存します。元ファイル名をR2キーへ直接使いません。ポートフォリオ用に、Workerの一覧・閲覧GET APIは認証なしで利用できます。R2自体は公開せず、Workerが読み取り専用の窓口になります。

## 今後の拡張

- D1で文書メタデータを永続化
- 管理者向けの認証付き管理画面を別ホストで用意
- 差し替え時の旧版管理と再インデックス
- 削除時のR2・D1・Vectorizeの一括削除
- 管理者ロール、操作ログ、監査履歴
