import type { Message } from "@/lib/schemas";
import type { ListMessagesQuery, MessageListCursor } from "@/ports/memory-port";

function isStrictlyOlder(message: Message, before: MessageListCursor): boolean {
  if (message.createdAt < before.createdAt) {
    return true;
  }
  if (message.createdAt > before.createdAt) {
    return false;
  }
  return message.id < before.id;
}

/**
 * Filtre + page sur un fil déjà trié oldest → newest (mock / tests).
 */
export function selectMessagePage(
  messages: readonly Message[],
  query?: ListMessagesQuery,
): Message[] {
  let filtered = [...messages];

  if (query?.before) {
    const before = query.before;
    filtered = filtered.filter((message) => isStrictlyOlder(message, before));
  }

  if (query?.limit !== undefined) {
    if (query.limit <= 0) {
      return [];
    }
    return filtered.slice(-query.limit);
  }

  return filtered;
}
