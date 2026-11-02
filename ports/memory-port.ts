import type { Message } from "@/lib/schemas";

export interface MemoryPort {
  listMessages(): Promise<Message[]>;
  appendMessage(message: Message): Promise<void>;
}
