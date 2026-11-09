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
 * Zone mark + wordmark E.L.S.A. dans la colonne milieu.
 * Le nom reste sous le ring après le boot (pas un overlay jetable).
 */
export function AssistantStage() {
  const { phase, briefingReady, skipCenteredBriefing, bootPlaying } =
    useHomeEnter();
  const briefing = phase === "briefing" && !skipCenteredBriefing;
  const slotSize = briefing ? MARK_SLOT_SIZE.splash : MARK_SLOT_SIZE.home;
  const wordmarkSettled = !bootPlaying && (!briefing || briefingReady);

  return (
    <div
      data-home="assistant-stage"
      className="relative flex min-h-0 w-full max-w-full flex-1 flex-col items-center justify-center px-1 pb-[5.5rem] sm:pb-24"
    >
      <div className="relative flex w-full max-w-full shrink-0 flex-col items-center justify-center">
        <MarkSlot name={briefing ? "splash" : "home"} className={slotSize} />
        <div
          className={cn("w-full shrink-0", MARK_HOME_CHROME_BELOW)}
          aria-hidden
        />
        <div className="mt-6 flex w-full justify-center sm:mt-8">
          <SplashWordmark
            bootActive={bootPlaying}
            settled={wordmarkSettled}
            size={briefing ? "display" : "home"}
          />
        </div>
      </div>
    </div>
  );
}
