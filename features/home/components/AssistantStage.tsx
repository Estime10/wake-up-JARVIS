"use client";

import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import { MarkSlot } from "@/features/jarvis/components/MarkSlot";
import {
  MARK_HOME_CHROME_BELOW,
  MARK_SLOT_SIZE,
} from "@/features/jarvis/model/markSlotSizes";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { cn } from "@/lib/cn";

/**
 * Zone mark (+ wordmark uniquement en briefing centré legacy).
 * Refonte-ui : taille splash permanente, mark reste centré (pas de scale-down).
 */
export function AssistantStage() {
  const { phase, briefingReady, skipCenteredBriefing } = useHomeEnter();
  const briefing = phase === "briefing" && !skipCenteredBriefing;

  return (
    <div className="relative flex w-full max-w-full shrink-0 flex-col items-center">
      <MarkSlot
        name={briefing ? "splash" : "home"}
        className={MARK_SLOT_SIZE.splash}
      />
      {/* Réserve chrome SVG — toujours présente pour stabiliser le centre. */}
      <div
        className={cn("w-full shrink-0", MARK_HOME_CHROME_BELOW)}
        aria-hidden
      />

      {briefing ? (
        <div className="mt-6 flex justify-center sm:mt-8">
          <SplashWordmark settled={briefingReady} size="display" />
        </div>
      ) : null}
    </div>
  );
}
