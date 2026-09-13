# Progress Log

## 2026-08-17

- 作業開始。空のディレクトリであることとGit未初期化を確認。
- 計画書の要求を、初期プロジェクトとして実装可能な骨格へ分解した。
- Cloudflare Vectorize / Workersのローカル参照とGitHub公開スキルを確認した。
- Context7でNext.js App Router / Route Handlerの現行仕様を確認した。
- Next.js UI、RAGコア、ローカルLLMアダプター、Cloudflare Worker bridge、READMEと履歴を作成した。
- 次は依存関係をインストールし、型検査・テスト・ビルドを実行する。
- npmの存在しないWorkers Types版を検出し、レジストリの現行版へ修正した。
- `npm run typecheck` と `npm run build` は成功。Vitestは `@/*` aliasを解決できず失敗したため、テストを相対importへ修正した。
- Vitestは成功。Wrangler型生成は権限付き実行で成功し、生成した `worker-configuration.d.ts` とWorker専用tsconfigを追加した。
- 実HTTP確認で日本語検索の初期実装がヒットしない不具合を発見。文字バイグラムを併用する検索へ修正し、専用テストを追加した。
- 実HTTPでTXTアップロード（1ページ・1チャンク）と、アップロード後の代表質問検索・根拠返却を確認した。

## 2026-09-13 Issue #3

- 3冊15ページの本文をJSON fixtureへ集約した。
- 固定検索チャンク、文書一覧、Chat文言、質問例をバックオフィス用途へ変更した。
- 法令上のルール、架空会社の社内運用例、個別確認事項、利用上の注意を各ページへ配置した。
- 公的資料の確認日を2026-09-13として記録した。
- ReportLabで3冊のPDFを生成し、pdfplumberとPopplerでページ数、抽出文字、描画を確認した。
- R2用の原本3件とページ単位15件をローカルへステージングし、18オブジェクトを検証した。
- 公開デプロイ、R2置換、旧オブジェクト削除は明示承認待ちのため未実施とした。
- 検証完了: Next.js/Worker型検査、Vitest 4件、Next.js本番ビルド、health/query/uploadの実HTTP確認が成功。
- Git初期化・ステージ準備を完了。`.next`、`node_modules`、`.bm25`、TypeScriptキャッシュは除外した。
- GitHubの候補リポジトリは未検出、CLI認証は無効。リモートは設定せず、公開を保留する。
- GitHub認証が回復し、実リポジトリ `second-works/-local-rag-document-assistant`（Public）を確認した。
- OpenNext `1.20.2` のCloudflare変換ビルドとCloudflare環境型生成が成功。Next.js/Worker型検査とVitestも再通過した。
- GitHubへ `main` をプッシュし、Cloudflare Workersへデプロイ成功。公開URLは `https://local-rag-document-assistant.katamachi.workers.dev`。
- 初回公開時のHTTP確認: トップ200、`/api/health`正常、代表質問が根拠付き回答を返した。
- ローカルGemmaを確認: `127.0.0.1:8081/health` 正常、モデルID `gemma-4-e4b`。
- 第2作専用Named Tunnel `local-rag-llm`（ID `118d0011-4f4a-4112-81b3-e1a08e1af79a`）を作成し、`local-rag-llm.amirkatamachi.com` を専用TunnelへDNSルーティングした。
- `127.0.0.1:8091` 認証プロキシを追加。認証なしPOSTは401、許可対象外パスは404、Ingress validateはOK。
- 未完了: Cloudflare Access Service Auth、Worker Secrets、実proxy/Tunnel起動、外部認証済みGemma回答の受入確認。
