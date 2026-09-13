import { lexicalSimilarity } from "./similarity";
import type { DocumentChunk, Source } from "./types";
import { DEMO_CHUNKS } from "../demo/documents";

const MIN_SCORE = 0.22;
const store: DocumentChunk[] = [...DEMO_CHUNKS];

export function addChunks(chunks: DocumentChunk[]) {
  store.unshift(...chunks);
}

export function searchChunks(question: string, topK = 5): Source[] {
  return store.map((chunk) => ({ ...chunk, score: lexicalSimilarity(question, chunk.text) })).filter((chunk) => chunk.score >= MIN_SCORE).sort((a, b) => b.score - a.score).slice(0, topK);
}
