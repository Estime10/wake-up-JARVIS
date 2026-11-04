import type { ConversationMessage } from "@/features/home/model/conversationMessage";
import { formatMessageTime } from "@/features/home/model/conversationMessage";
import type { Message } from "@/lib/schemas";

/** Map domaine MemoryPort → modèle d'affichage home. */
export function toConversationMessage(message: Message): ConversationMessage {
  return {
    id: message.id,
    role: message.role,
    text: message.text,
    time: formatMessageTime(new Date(message.createdAt)),
    createdAt: message.createdAt,
  };
}
