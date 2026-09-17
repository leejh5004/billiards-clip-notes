export function sortByNewest<T extends { createdAt: number }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.createdAt - a.createdAt);
}
