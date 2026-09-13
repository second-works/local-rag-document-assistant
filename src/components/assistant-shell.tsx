"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { DocumentSummary, QueryResponse } from "@/lib/rag/types";
import { PdfPageViewer } from "@/components/pdf-page-viewer";
import { DEMO_DISCLAIMER, DEMO_DOCUMENTS } from "@/lib/demo/documents";

type View = "chat" | "maintenance" | "system";

const initialDocuments: DocumentSummary[] = DEMO_DOCUMENTS;

function formatSize(size: number) {
  if (size === 0) return "demo data";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function AssistantShell() {
  const [view, setView] = useState<View>("chat");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState(initialDocuments);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentSummary | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [maintenanceError, setMaintenanceError] = useState("");

  const totalChunks = useMemo(() => documents.reduce((sum, document) => sum + document.chunks, 0), [documents]);

  async function loadDocuments() {
    setMaintenanceError("");
    try {
      const response = await fetch("/api/documents", { cache: "no-store" });
      if (!response.ok) throw new Error("document list failed");
      const body = (await response.json()) as { documents: DocumentSummary[] };
      setDocuments(body.documents);
    } catch {
      setMaintenanceError("文書一覧を取得できませんでした。");
    }
  }

  useEffect(() => {
    if (view === "maintenance") void loadDocuments();
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setViewerUrl(null);
    if (!selectedDocument?.viewable) return;

    setViewerLoading(true);
    void fetch(`/api/documents/${selectedDocument.documentId}/file?page=${currentPage}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("document file unavailable");
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setViewerUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setMaintenanceError("PDFを取得できませんでした。保存状態を確認してください。");
      })
      .finally(() => {
        if (!cancelled) setViewerLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedDocument, currentPage]);

  function selectDocument(document: DocumentSummary) {
    setCurrentPage(1);
    setSelectedDocument(document);
  }

  async function ask(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    try {
      const response = await fetch("/api/query", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ question: trimmed }) });
      const body = (await response.json()) as QueryResponse;
      setResult(body);
    } catch {
      setResult({ answer: "接続エラーが発生しました。APIの状態を確認してください。", sources: [], grounded: false, mode: "error" });
    } finally {
      setLoading(false);
      setQuestion("");
    }
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">R</div><div><strong>Local RAG</strong><small>Document Assistant</small></div></div>
        <div className="nav-label">Workspace</div>
        <nav className="nav" aria-label="Workspace navigation">
          <button className={view === "chat" ? "active" : ""} onClick={() => setView("chat")}>Chat</button>
          <button className={view === "maintenance" ? "active" : ""} onClick={() => setView("maintenance")}>管理画面</button>
          <button className={view === "system" ? "active" : ""} onClick={() => setView("system")}>System</button>
        </nav>
        <div className="sidebar-footer"><span className="local-pill"><span className="dot" /> Local inference enabled</span><p style={{ color: "#8cb2a8", fontSize: 11, lineHeight: 1.5 }}>業務文書は外部LLMへ送信せず、ローカルLLM境界で処理します。</p></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">Portfolio 02 / Local AI System</div><h1>文書を根拠付きで検索する</h1><p className="subtitle">経費、備品、勤怠・休暇のバックオフィス文書を検索し、Gemma 4 のローカル推論で回答します。すべての回答に参照ページと根拠文章を添えます。</p></div>
          <div className="status-grid"><div className="status-card"><span>LLM</span><strong>Gemma 4</strong></div><div className="status-card"><span>Inference</span><strong className="online">LOCAL</strong></div><div className="status-card"><span>RAG</span><strong className="online">ONLINE</strong></div></div>
        </header>

        <div className="workspace">
          {view === "chat" && <section className="panel chat-panel"><div className="panel-heading"><div><h2>バックオフィス文書アシスタント</h2><p>登録済み文書だけを根拠に回答します</p></div><span className="source-count">{documents.length} documents</span></div><div className="messages"><p className="legal-notice">{DEMO_DISCLAIMER}</p>{result ? <><div className="message user"><div className="message-label">あなた</div><div className="bubble">{result.question ?? "質問"}</div></div><div className="message"><div className="message-label">Local RAG Assistant</div><div className="bubble">{result.answer}</div><div className="answer-meta"><strong>{result.grounded ? "根拠あり" : "回答不能"}</strong><span>・</span><span>{result.mode === "local" ? "Gemma 4 / local API" : "retrieval fallback"}</span></div>{result.sources.length > 0 && <div className="sources">{result.sources.map((source) => <div className="source" key={source.chunkId}><div className="source-top"><span>{source.documentName} / {source.page}ページ</span><span className="score">{Math.round(source.score * 100)}%</span></div><p>「{source.text}」</p></div>)}</div>}</div></> : <div className="message"><div className="message-label">Local RAG Assistant</div><div className="bubble">質問を入力してください。検索された文書の範囲だけを使い、確認できない場合はその旨を回答します。</div></div>}</div><form className="composer" onSubmit={ask}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="例：領収書を紛失した場合はどうしますか。" aria-label="質問" /><button className="primary" type="submit">{loading ? "検索中…" : "質問する"}</button></form></section>}

          {view === "maintenance" && <section className="maintenance-layout">
            <section className="panel maintenance-list">
              <div className="panel-heading"><div><div className="eyebrow dark-eyebrow">Maintenance / 管理画面</div><h2>登録文書の閲覧</h2><p>ポートフォリオ用の読み取り専用文書一覧です。</p></div></div>
              <div className="admin-toolbar"><span>{documents.length} files ・ {totalChunks} chunks</span></div>
              {maintenanceError && <p className="error-notice" role="alert">{maintenanceError}</p>}
              <div className="document-list">{documents.map((document) => <div className={`document-row ${selectedDocument?.documentId === document.documentId ? "selected" : ""}`} key={document.documentId} onClick={() => selectDocument(document)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") selectDocument(document); }} role="button" tabIndex={0}><div><div className="document-name">{document.name}</div><div className="document-meta">{document.pages} pages ・ {document.chunks} chunks ・ {formatSize(document.size)} ・ {document.date.slice(0, 10)}</div></div>{document.viewable ? <span className="view-button">PDFを閲覧</span> : <span className="unavailable">PDF未配置</span>}</div>)}</div>
            </section>
            <section className="panel viewer-panel"><div className="panel-heading"><div><h2>閲覧モード</h2><p>{selectedDocument?.name ?? "一覧からPDFを選択してください"}</p></div>{selectedDocument?.viewable && <span className="source-count">PDF</span>}</div>{selectedDocument?.viewable && viewerUrl && <div className="viewer-controls"><button className="secondary" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage <= 1}>‹ 前のページ</button><span>{currentPage} / {selectedDocument.pages}ページ</span><button className="secondary" onClick={() => setCurrentPage((page) => Math.min(selectedDocument.pages, page + 1))} disabled={currentPage >= selectedDocument.pages}>次のページ ›</button></div>}{viewerLoading && <div className="viewer-empty">PDFを読み込んでいます…</div>}{viewerUrl && <PdfPageViewer key={viewerUrl} fileUrl={viewerUrl} title={`${selectedDocument?.name ?? "PDF"} ${currentPage}ページ`} />}{!viewerLoading && !viewerUrl && <div className="viewer-empty">{selectedDocument ? "この文書の元PDFは現在閲覧できません。" : "文書行をクリックすると、ここにPDFが表示されます。"}</div>}</section>
          </section>}

          {view === "system" && <section className="system-grid"><div className="panel system-card"><h3>Generation model</h3><strong>Gemma 4</strong><p>OpenAI互換HTTP APIを通じて交換可能なローカルLLM。</p></div><div className="panel system-card"><h3>Vector search</h3><strong>Top 5</strong><p>Embeddingと生成LLMを分離。低スコア結果は回答根拠に使いません。</p></div><div className="panel system-card"><h3>Documents</h3><strong>{documents.length}</strong><p>登録文書数。ページと根拠文章を回答へ引き継ぎます。</p></div><div className="panel system-card"><h3>Security boundary</h3><strong>Private</strong><p>ローカルLLMポートを直接公開せず、認証済みのCloudflare Bridge経由で接続します。</p></div><div className="panel system-card"><h3>Current runtime</h3><strong>Demo</strong><p>環境変数未設定時はローカル検証用のフォールバック回答を使います。</p></div><div className="panel system-card"><h3>Next milestone</h3><strong>Vectorize</strong><p>Embeddingモデルの日本語検索評価後にインデックス次元を固定します。</p></div></section>}
        </div>
      </main>
    </div>
  );
}
