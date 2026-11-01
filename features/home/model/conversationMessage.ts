export type ConversationRole = "assistant" | "user";

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  text: string;
  /** HH:MM local — affichage seul. */
  time: string;
  streaming?: boolean;
};

export function formatMessageTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
