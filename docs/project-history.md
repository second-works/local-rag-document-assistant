# Project history

## 2026-09-13 Issue #3バックオフィス文書への置換

- Requirements: 経費、備品、勤怠及び休暇の3冊、各5ページ、合計15チャンクへ置き換える。
- Decision: 法令上のルール、架空会社の社内運用例、個別確認事項を各ページで分ける。
- Decision: JSON fixtureを検索、文書一覧、PDF生成の共通データ源とする。
- User impact: Chat、管理画面、質問例、PDF、README、説明書をバックオフィス用途へ統一する。
- Safety boundary: 公開デプロイ、R2置換、旧オブジェクト削除は人間の明示承認まで実行しない。

## 2026-08-17 Project created

- Created Portfolio 02, Local RAG Document Assistant, as a new project.
- User impact: provides a browser-based demo shell for asking questions over business documents and viewing source pages, scores, and evidence text.
- Technical impact: establishes page-aware chunking, a score threshold, local OpenAI-compatible LLM adapter, and a Cloudflare-authenticated bridge boundary.
- Deployment impact: adds the OpenNext Cloudflare adapter so the Next.js UI and Route Handlers can be served from one public Workers URL.
- Completed: GitHub publication to `second-works/-local-rag-document-assistant` and Cloudflare Workers deployment.
- Live URL: https://local-rag-document-assistant.katamachi.workers.dev
- Tunnel update: created dedicated Named Tunnel `local-rag-llm` (`118d0011-4f4a-4112-81b3-e1a08e1af79a`) and routed `local-rag-llm.amirkatamachi.com` to the authenticated local proxy.
- Maintenance update: changed the 管理画面 to a public read-only portfolio view with document list and browser PDF viewer; removed upload, reload, and maintenance-key UI/API requirements. The private R2 bucket remains the file source.
- Not yet completed: Cloudflare Access Service Auth/Worker Secrets setup, live Gemma 4 acceptance, embedding model evaluation, and D1/Vectorize provisioning.
