import type { AssistantState } from "@/features/home/model/assistantMachine";
import { MarkSlot } from "@/features/jarvis/components/MarkSlot";
import { t } from "@/lib/i18n";

type AssistantStageProps = {
  state: AssistantState;
};

/**
 * Zone centrale — MarkSlot + libellés d’état.
 * L’anneau SVG animé vit dans PersistentMark (useVoiceRingMotion).
 * Libellés visuels seulement (`aria-hidden`) : l'écoute est annoncée par le
 * `role="status"` unique du header (HomeStatusHeader), les autres états par
 * l'annonceur polite unique (StatusAnnouncer).
 */
export function AssistantStage({ state }: AssistantStageProps) {
  const showListening = state === "listening";
  const showSpeaking = state === "speaking";
  const showThinking = state === "thinking";

  return (
    <div className="flex w-full flex-col items-center">
      <MarkSlot
        name="home"
        className="size-[min(54vw,17rem)] sm:size-[min(38vw,18.5rem)]"
      />

      {showListening ? (
        <div
          className="mt-5 flex flex-col items-center gap-1"
          aria-hidden="true"
        >
          <p className="t-mono text-sm text-text">{t("home.stateListening")}</p>
          <p className="t-mono text-sm text-text-muted">
            {t("home.listeningHint")}
          </p>
        </div>
      ) : null}

      {showThinking ? (
        <div className="mt-5 flex flex-col items-center" aria-hidden="true">
          <p className="t-mono text-sm text-text-muted">
            {t("home.stateThinking")}
          </p>
        </div>
      ) : null}

      {showSpeaking ? (
        <div className="mt-5 flex flex-col items-center" aria-hidden="true">
          <p className="t-mono text-sm text-text">{t("home.stateSpeaking")}</p>
        </div>
      ) : null}
    </div>
  );
}
