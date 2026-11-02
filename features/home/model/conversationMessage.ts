import type { ActionStatus } from "@/lib/actions/lifecycle";
import type { ActionProposal } from "@/lib/schemas";

export type ConversationRole = "assistant" | "user";

export type ConversationActionState = {
  proposal: ActionProposal;
  status: ActionStatus;
  outputLines: string[];
  exitCode?: number;
  notice?: string;
};

export type ConversationMessage = {
  id: string;
  role: ConversationRole;
  text: string;
  /** HH:MM local — affichage seul. */
  time: string;
  streaming?: boolean;
  /** Carte d'action inline (assistant). */
  action?: ConversationActionState;
};

export function formatMessageTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
