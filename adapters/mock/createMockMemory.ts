import { MOCK_SEED_MESSAGES } from "@/fixtures/messages";
import { messageSchema, type Message } from "@/lib/schemas";
import type { MemoryPort } from "@/ports/memory-port";

/** Mock mémoire — copie en RAM des seeds, validée à l'écriture. */
export function createMockMemory(): MemoryPort {
  const messages: Message[] = MOCK_SEED_MESSAGES.map((m) =>
    messageSchema.parse(m),
  );

  return {
    async listMessages() {
      return messages.map((m) => ({ ...m }));
    },

    async appendMessage(message) {
      messages.push(messageSchema.parse(message));
    },
  };
}
