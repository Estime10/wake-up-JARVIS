export type SupabaseProjectMatchable = {
  name: string;
  ref: string;
};

/**
 * Résout un suivi Studio : index de liste (« 2 », « 2. JARVIS ») ou nom / ref.
 */
export function resolveSupabaseProjectQuery<T extends SupabaseProjectMatchable>(
  query: string,
  entries: readonly T[],
): T | null {
  const raw = query.trim();
  if (!raw || entries.length === 0) {
    return null;
  }

  const indexOnly = raw.match(/^(?:n(?:°|o|um(?:e|é)ro)?\s*)?(\d+)\s*[.)]?$/i);
  if (indexOnly) {
    const n = Number.parseInt(indexOnly[1]!, 10);
    if (n >= 1 && n <= entries.length) {
      return entries[n - 1] ?? null;
    }
    return null;
  }

  const indexed = raw.match(/^(\d+)\s*[.)]\s+(.+)$/u);
  if (indexed) {
    const n = Number.parseInt(indexed[1]!, 10);
    const rest = indexed[2]!.trim();
    if (n >= 1 && n <= entries.length) {
      const byIndex = entries[n - 1]!;
      const restLower = rest.toLowerCase();
      const nameLower = byIndex.name.toLowerCase();
      if (
        !rest ||
        nameLower === restLower ||
        nameLower.includes(restLower) ||
        restLower.includes(nameLower) ||
        byIndex.ref.toLowerCase() === restLower
      ) {
        return byIndex;
      }
    }
    return resolveSupabaseProjectQuery(rest, entries);
  }

  const q = raw.toLowerCase();
  return (
    entries.find(
      (entry) =>
        entry.name.toLowerCase() === q || entry.ref.toLowerCase() === q,
    ) ??
    entries.find(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.ref.toLowerCase().includes(q),
    ) ??
    null
  );
}
