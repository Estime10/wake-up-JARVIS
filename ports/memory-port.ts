import type { Message } from "@/lib/schemas";

/** Curseur exclusif — messages strictement plus anciens. */
export type MessageListCursor = {
  createdAt: string;
  id: string;
};

/**
 * Pagination chronologique.
 * Sans `limit` : tout le fil (ordre croissant).
 * Avec `limit` : les N plus récents du filtre (toujours renvoyés oldest → newest).
 */
export type ListMessagesQuery = {
  limit?: number;
  before?: MessageListCursor;
};

export interface MemoryPort {
  listMessages(query?: ListMessagesQuery): Promise<Message[]>;
  appendMessage(message: Message): Promise<void>;
}
