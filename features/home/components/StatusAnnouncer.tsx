import type { AssistantState } from "@/features/home/model/assistantMachine";
import { t, type MessageKey } from "@/lib/i18n";

/**
 * Message annoncé par état. `listening` : rien (« Micro actif » est porté par
 * le seul `role="status"` du header). `idle` : rien (la réponse finie est
 * annoncée par le `role="log"` de la conversation, pas ici).
 */
const ANNOUNCEMENT_KEY: Record<AssistantState, MessageKey | null> = {
  idle: null,
  listening: null,
  thinking: "home.announceThinking",
  speaking: "home.announceSpeaking",
  error: "home.announceError",
  offline: "home.announceOffline",
};

type StatusAnnouncerProps = {
  state: AssistantState;
};

/**
 * Annonceur unique `aria-live="polite"` (PLAN-UI `StatusAnnouncer`), toujours
 * monté, sans `role="status"`. Les libellés visuels restent `aria-hidden`.
 */
export function StatusAnnouncer({ state }: StatusAnnouncerProps) {
  const key = ANNOUNCEMENT_KEY[state];

  return (
    <p className="sr-only" aria-live="polite">
      {key ? t(key) : null}
    </p>
  );
}
