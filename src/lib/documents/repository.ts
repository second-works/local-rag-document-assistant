import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { R2Bucket } from "@cloudflare/workers-types";
import type { DocumentSummary } from "@/lib/rag/types";
import { DEMO_DOCUMENTS } from "@/lib/demo/documents";

function getDocumentsBucket(): R2Bucket | undefined {
  try {
    const { env } = getCloudflareContext() as unknown as { env: { DOCUMENTS?: R2Bucket } };
    return env.DOCUMENTS;
  } catch {
    return undefined;
  }
}

function sortDocuments(documents: DocumentSummary[]) {
  return documents.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
}

function mergeDocuments(stored: DocumentSummary[]) {
  const documents = new Map(DEMO_DOCUMENTS.map((document) => [document.documentId, document]));
  for (const document of stored) documents.set(document.documentId, document);
  return sortDocuments([...documents.values()]);
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const bucket = getDocumentsBucket();
  if (!bucket) return sortDocuments([...DEMO_DOCUMENTS]);

  const listed = await bucket.list({ prefix: "documents/", limit: 1000 });
  const stored = (await Promise.all(listed.objects.map(async (listedObject) => {
    const object = await bucket.head(listedObject.key);
    const metadata = object?.customMetadata ?? {};
    const demoDocument = DEMO_DOCUMENTS.find((document) => document.documentId === listedObject.key.slice("documents/".length));
    if (!metadata.documentId && !demoDocument) return [];
    if (demoDocument && !metadata.documentId) {
      return [{ ...demoDocument, size: object?.size ?? listedObject.size, viewable: true } satisfies DocumentSummary];
    }
    return [{
      documentId: metadata.documentId ?? demoDocument?.documentId ?? "",
      name: metadata.name ?? demoDocument?.name ?? listedObject.key,
      size: Number(metadata.size ?? object?.size ?? listedObject.size),
      pages: Number(metadata.pages ?? demoDocument?.pages ?? 0),
      chunks: Number(metadata.chunks ?? demoDocument?.chunks ?? 0),
      date: metadata.date ?? demoDocument?.date ?? object?.uploaded.toISOString() ?? listedObject.uploaded.toISOString(),
      contentType: metadata.contentType ?? demoDocument?.contentType ?? object?.httpMetadata?.contentType ?? "application/octet-stream",
      viewable: (metadata.contentType ?? demoDocument?.contentType ?? object?.httpMetadata?.contentType) === "application/pdf" || (metadata.name ?? demoDocument?.name ?? "").toLowerCase().endsWith(".pdf"),
    } satisfies DocumentSummary];
  }))).flat();
  return mergeDocuments(stored);
}

export async function getDocumentFile(documentId: string, page?: number) {
  const bucket = getDocumentsBucket();
  if (!bucket) return null;

  const baseKey = `documents/${documentId}`;
  const baseObject = await bucket.head(baseKey);
  if (!baseObject) return null;
  const objectKey = page ? `${baseKey}/pages/${page}` : baseKey;
  const object = await bucket.get(objectKey);
  if (!object || !("body" in object)) return null;
  const metadata = baseObject.customMetadata ?? {};
  const demoDocument = DEMO_DOCUMENTS.find((document) => document.documentId === documentId);
  if (!metadata.documentId && !demoDocument) return null;
  return {
    body: object.body,
    summary: {
      documentId: metadata.documentId ?? demoDocument?.documentId ?? documentId,
      name: metadata.name ?? demoDocument?.name ?? `document-${documentId}`,
      size: Number(metadata.size ?? baseObject.size),
      pages: Number(metadata.pages ?? demoDocument?.pages ?? 0),
      chunks: Number(metadata.chunks ?? demoDocument?.chunks ?? 0),
      date: metadata.date ?? demoDocument?.date ?? baseObject.uploaded.toISOString(),
      contentType: metadata.contentType ?? demoDocument?.contentType ?? baseObject.httpMetadata?.contentType ?? "application/octet-stream",
      viewable: true,
    } satisfies DocumentSummary,
    httpMetadata: object.httpMetadata,
    etag: object.httpEtag,
  };
}
