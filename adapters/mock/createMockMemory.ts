import { selectMessagePage } from "@/lib/memory/selectMessagePage";
import { messageSchema, type Message } from "@/lib/schemas";
import type { ListMessagesQuery, MemoryPort } from "@/ports/memory-port";

/** Mock mémoire — fil vide en RAM, validée à l'écriture. */
export function createMockMemory(): MemoryPort {
  const messages: Message[] = [];

  return {
    async listMessages(query?: ListMessagesQuery) {
      return selectMessagePage(messages, query).map((m) => ({ ...m }));
    },

    async appendMessage(message) {
      messages.push(messageSchema.parse(message));
    },
  };
}
