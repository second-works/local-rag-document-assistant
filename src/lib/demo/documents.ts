import demoData from "../../../fixtures/demo-backoffice-documents.json";
import type { DocumentChunk, DocumentSummary } from "@/lib/rag/types";

export type DemoDocumentItem = {
  heading: string;
  category: "法令上のルール" | "架空会社の社内運用例" | "個別確認事項";
  body: string;
};

export type DemoDocumentPage = {
  chapter: string;
  items: DemoDocumentItem[];
};

export type DemoDocument = {
  documentId: string;
  name: string;
  version: string;
  enactedAt: string;
  pages: DemoDocumentPage[];
};

const data = demoData as {
  checkedAt: string;
  disclaimer: string;
  sources: { label: string; url: string }[];
  documents: DemoDocument[];
};

export const DEMO_LEGAL_CHECKED_AT = data.checkedAt;
export const DEMO_DISCLAIMER = data.disclaimer;
export const DEMO_SOURCES = data.sources;
export const DEMO_DOCUMENT_DATA = data.documents;

export function pageText(document: DemoDocument, page: DemoDocumentPage) {
  return [
    document.name,
    document.version,
    `制定日 ${document.enactedAt}`,
    "デモ用文書",
    page.chapter,
    ...page.items.flatMap((item) => [item.heading, item.category, item.body]),
    "利用上の注意",
    DEMO_DISCLAIMER,
  ].join("\n");
}

export const DEMO_DOCUMENTS: DocumentSummary[] = DEMO_DOCUMENT_DATA.map((document) => ({
  documentId: document.documentId,
  name: document.name,
  size: 0,
  pages: document.pages.length,
  chunks: document.pages.length,
  date: document.enactedAt,
  contentType: "application/pdf",
  viewable: false,
}));

export const DEMO_CHUNKS: DocumentChunk[] = DEMO_DOCUMENT_DATA.flatMap((document) =>
  document.pages.map((page, index) => ({
    chunkId: `${document.documentId}-${index + 1}`,
    documentId: document.documentId,
    documentName: document.name,
    page: index + 1,
    text: pageText(document, page),
  })),
);
