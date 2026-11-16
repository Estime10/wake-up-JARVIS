/**
 * Probe limit+1 pour savoir s’il reste de l’historique.
 */
export function takeConversationPage<T>(
  items: T[],
  pageSize: number,
): {
  page: T[];
  hasMore: boolean;
} {
  if (items.length > pageSize) {
    return { page: items.slice(-pageSize), hasMore: true };
  }
  return { page: items, hasMore: false };
}
