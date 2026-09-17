const JOSA = [
  "에서",
  "으로",
  "부터",
  "까지",
  "한테",
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "의",
  "에",
  "로",
  "와",
  "과",
  "도",
  "만",
  "께",
];

const STOPWORDS = new Set([
  "그리고",
  "그래서",
  "근데",
  "그러나",
  "너무",
  "아주",
  "조금",
  "그냥",
  "정말",
  "진짜",
  "이거",
  "저거",
  "그것",
  "이것",
  "오늘",
  "지금",
  "하다",
  "있다",
  "없다",
  "같다",
  "되다",
  "이다",
  "않다",
]);

function stripJosa(token: string): string {
  let result = token;
  for (const josa of JOSA) {
    if (result.endsWith(josa)) {
      result = result.slice(0, -josa.length);
      break;
    }
  }
  for (const josa of JOSA) {
    if (result.startsWith(josa)) {
      result = result.slice(josa.length);
      break;
    }
  }
  return result;
}

export function extractKeywords(memo: string): string[] {
  const parts = memo.normalize("NFC").split(/[^가-힣a-zA-Z0-9]+/).filter(Boolean);
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const part of parts) {
    const stripped = stripJosa(part).toLowerCase();
    if (!stripped) continue;
    if (!/^[가-힣a-zA-Z0-9]+$/.test(stripped)) continue;
    if ([...stripped].length < 2) continue;
    if (STOPWORDS.has(stripped)) continue;
    if (seen.has(stripped)) continue;
    seen.add(stripped);
    keywords.push(stripped);
  }

  return keywords;
}
