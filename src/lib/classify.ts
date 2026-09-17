export function frequentKeywords(
  entries: { keywords: string[] }[],
): string[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const unique = new Set(entry.keywords);
    for (const word of unique) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .map(([word]) => word);
}

export function filterByKeyword<T extends { keywords: string[] }>(
  entries: T[],
  keyword: string | null,
): T[] {
  if (!keyword) return entries;
  return entries.filter((entry) => entry.keywords.includes(keyword));
}
