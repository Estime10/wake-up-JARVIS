"use client";

import { AssistantExpansionLabel } from "@/features/home/components/ui/conversation/stage/AssistantExpansionLabel";
import { AssistantStage } from "@/features/home/components/ui/conversation/stage/AssistantStage";
import { HomeComposer } from "@/features/home/components/ui/conversation/composer/HomeComposer";
import { HomeStatusHeader } from "@/features/home/components/ui/conversation/stage/HomeStatusHeader";
import { StatusAnnouncer } from "@/features/home/components/ui/conversation/stage/StatusAnnouncer";
import type { AssistantState } from "@/features/home/model/assistantMachine";
import { PANEL_CONTENT_MOTION_CLASS } from "@/features/home/model/panelContentMotion";
import { cn } from "@/lib/cn";

type HomeCenterColumnProps = {
  state: AssistantState;
  settled: boolean;
  briefing: boolean;
  composerPending: boolean;
  memoryReady: boolean;
  listenSeed: string | undefined;
  onSubmit: (text: string) => void;
  onToggleListening: () => void;
};

/** Colonne centre — mark, statut, composer. */
export function HomeCenterColumn({
  state,
  settled,
  briefing,
  composerPending,
  memoryReady,
  listenSeed,
  onSubmit,
  onToggleListening,
}: HomeCenterColumnProps) {
  const listening = state === "listening";
  /** Pendant la parole : saisie OK (barge-in). Bloqué en réflexion / boot / mémoire. */
  const composerLocked = state === "thinking" || !memoryReady || !settled;

  return (
    <div className="relative flex min-h-0 min-w-0 flex-col">
      <HomeStatusHeader listening={listening} />
      <StatusAnnouncer state={state} />

      <div
        className={cn(
          "relative flex min-h-0 w-full flex-1 flex-col items-center px-2",
          PANEL_CONTENT_MOTION_CLASS,
        )}
      >
        <AssistantStage />

        <AssistantExpansionLabel visible={!composerPending && !briefing} />

        <div
          data-home="composer"
          className={cn(
            "absolute inset-x-0 bottom-5 z-20 mb-0 flex w-full justify-center px-2 sm:bottom-6",
            composerPending && "pointer-events-none opacity-0",
          )}
          aria-hidden={composerPending || undefined}
        >
          <div className="flex w-full justify-center">
            <HomeComposer
              onSubmit={onSubmit}
              listening={listening}
              onToggleListening={onToggleListening}
              disabled={composerLocked}
              ghost={state === "speaking"}
              listenSeed={listenSeed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
