import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";

/**
 * H2 / IV2-01 — les réponses mail (expéditeur, sujet, comptes…) restent
 * à l’écran / TTS, mais ne partent pas dans `messages` (MemoryPort).
 */
export function shouldPersistAssistantReply(
  intent: AssistantIntent | null | undefined,
): boolean {
  if (!intent) {
    return true;
  }
  return !intent.kind.startsWith("mail.");
}
