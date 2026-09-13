const JAPANESE_STOP_BIGRAMS = new Set(["から", "した", "た場", "場合", "合は"]);
const JAPANESE_GENERIC_BIGRAMS = new Set([
  "会社",
  "条件",
  "必要",
  "確認",
  "申請",
  "承認",
  "対応",
  "場合",
  "方法",
  "内容",
  "制度",
  "管理",
  "記録",
  "利用",
  "情報",
  "期限",
  "理由",
  "運用",
  "対象",
  "法令",
  "資料",
  "業務",
  "金額",
]);
const MIN_MEANINGFUL_OVERLAP = 2;

function isMeaningfulToken(token: string) {
  if (/^[a-z0-9]{2,}$/u.test(token)) return true;
  return /^(?:\p{Script=Han}|\p{Script=Katakana}){2}$/u.test(token) && !JAPANESE_GENERIC_BIGRAMS.has(token);
}

function tokenWeight(token: string) {
  if (/^\p{Script=Han}{2}$/u.test(token)) return 1.5;
  if (/^\p{Script=Katakana}{2}$/u.test(token)) return 0.8;
  return 1;
}

function tokens(value: string): Set<string> {
  const normalized = value.toLocaleLowerCase("ja-JP");
  const result = new Set(normalized.match(/[a-z0-9]{2,}/gu) ?? []);
  const japanese = normalized.replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, "");
  for (let index = 0; index < japanese.length - 1; index += 1) {
    const bigram = japanese.slice(index, index + 2);
    if (!JAPANESE_STOP_BIGRAMS.has(bigram)) result.add(bigram);
  }
  return result;
}

export function lexicalSimilarity(left: string, right: string): number {
  const a = tokens(left);
  const b = tokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  const meaningfulQueryTokens = [...a].filter(isMeaningfulToken);
  const meaningfulDocumentTokens = [...b].filter(isMeaningfulToken);
  const meaningfulIntersection = meaningfulQueryTokens.filter((token) => b.has(token));
  if (meaningfulQueryTokens.length === 0 || meaningfulIntersection.length === 0) return 0;
  if (meaningfulQueryTokens.length > 1 && meaningfulIntersection.length < MIN_MEANINGFUL_OVERLAP) return 0;
  const queryWeight = meaningfulQueryTokens.reduce((sum, token) => sum + tokenWeight(token), 0);
  const documentWeight = meaningfulDocumentTokens.reduce((sum, token) => sum + tokenWeight(token), 0);
  const intersectionWeight = meaningfulIntersection.reduce((sum, token) => sum + tokenWeight(token), 0);
  const cosineSimilarity = intersectionWeight / Math.sqrt(queryWeight * documentWeight);
  const queryCoverage = intersectionWeight / queryWeight;
  return queryCoverage * 0.8 + cosineSimilarity * 0.2;
}
