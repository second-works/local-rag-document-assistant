import { describe, expect, it } from "vitest";
import { lexicalSimilarity } from "../src/lib/rag/similarity";

describe("lexicalSimilarity", () => {
  it("matches related Japanese phrases without a morphological analyzer", () => {
    expect(lexicalSimilarity("領収書を紛失した場合は？", "領収書を紛失したときは再発行を依頼し、経理担当者へ相談する。")).toBeGreaterThan(0.15);
  });

  it("does not match unrelated questions", () => {
    expect(lexicalSimilarity("株式報酬の付与条件は？", "領収書を紛失したときは再発行を依頼し、経理担当者へ相談する。")).toBe(0);
  });
});
