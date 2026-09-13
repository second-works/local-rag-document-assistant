import { describe, expect, it } from "vitest";
import {
  DEMO_CHUNKS,
  DEMO_DISCLAIMER,
  DEMO_DOCUMENT_DATA,
  DEMO_DOCUMENTS,
  DEMO_LEGAL_CHECKED_AT,
  pageText,
} from "../src/lib/demo/documents";
import { searchChunks } from "../src/lib/rag/store";

const categories = new Set(["法令上のルール", "架空会社の社内運用例", "個別確認事項"]);

describe("back-office demo documents", () => {
  it("keeps the three-document, fifteen-page, one-page-one-chunk contract", () => {
    expect(DEMO_DOCUMENT_DATA).toHaveLength(3);
    expect(DEMO_DOCUMENTS.map((document) => document.documentId)).toEqual([
      "demo-expense",
      "demo-assets",
      "demo-attendance",
    ]);
    expect(DEMO_CHUNKS).toHaveLength(15);

    for (const document of DEMO_DOCUMENT_DATA) {
      expect(document.pages).toHaveLength(5);
      const summary = DEMO_DOCUMENTS.find((candidate) => candidate.documentId === document.documentId);
      expect(summary).toMatchObject({ name: document.name, pages: 5, chunks: 5 });

      document.pages.forEach((page, index) => {
        expect(page.items).toHaveLength(3);
        expect(new Set(page.items.map((item) => item.category))).toEqual(categories);
        const body = [
          page.chapter,
          ...page.items.flatMap((item) => [item.heading, item.category, item.body]),
          DEMO_DISCLAIMER,
        ].join("\n");
        expect(body.length).toBeGreaterThanOrEqual(450);
        expect(body.length).toBeLessThanOrEqual(600);
        expect(DEMO_CHUNKS).toContainEqual({
          chunkId: `${document.documentId}-${index + 1}`,
          documentId: document.documentId,
          documentName: document.name,
          page: index + 1,
          text: pageText(document, page),
        });
      });
    }
  });

  it("records a public-source check date and the legal disclaimer", () => {
    expect(DEMO_LEGAL_CHECKED_AT).toBe("2026-09-13");
    expect(DEMO_DISCLAIMER).toContain("法令適合を保証");
    expect(DEMO_DISCLAIMER).toContain("専門家");
  });

  it.each([
    ["領収書を紛失した場合はどうしますか。", "demo-expense", 3],
    ["3万円以上の備品購入には誰の承認が必要ですか。", "demo-assets", 2],
    ["有給休暇はいつまでに申請しますか。", "demo-attendance", 3],
    ["打刻を忘れた場合はどうしますか。", "demo-attendance", 1],
    ["貸与パソコンを紛失した場合はどこへ連絡しますか。", "demo-assets", 5],
    ["レシートをなくしたときの手続は？", "demo-expense", 3],
    ["年休を取るには上司の許可が必要ですか。", "demo-attendance", 3],
  ])("retrieves the expected page for %s", (question, documentId, page) => {
    expect(searchChunks(question)[0]).toMatchObject({ documentId, page });
  });

  it("retrieves both purchase and expense rules for a cross-document question", () => {
    const ids = new Set(searchChunks("業務用備品を立替購入した場合、購入申請と経費精算で何が必要ですか。").map((source) => source.documentId));
    expect(ids).toContain("demo-assets");
    expect(ids).toContain("demo-expense");
  });

  it.each([
    "株式報酬の付与条件は何ですか。",
    ["非常用", "発電機の点検頻度は？"].join(""),
    ["消防", "設備に異常が出た場合は？"].join(""),
    ["空調", "機から異音が発生した場合は？"].join(""),
  ])("returns no evidence for unsupported or legacy question: %s", (question) => {
    expect(searchChunks(question)).toEqual([]);
  });
});
