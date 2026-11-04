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
 * Home : pad sous le slot = chrome boot/réticules, puis 10px avant les messages.
 */
export function AssistantStage() {
  const { phase, briefingReady, skipCenteredBriefing } = useHomeEnter();
  const briefing = phase === "briefing" && !skipCenteredBriefing;

  return (
    <div className="flex w-full max-w-full shrink-0 flex-col items-center">
      <MarkSlot
        name={briefing ? "splash" : "home"}
        className={briefing ? MARK_SLOT_SIZE.splash : MARK_SLOT_SIZE.home}
      />
      {/* Espace layout pour le débordement SVG (mark fixed overflow visible). */}
      {!briefing ? (
        <div
          className={cn("w-full shrink-0", MARK_HOME_CHROME_BELOW)}
          aria-hidden
        />
      ) : null}

      {briefing ? (
        <div className="mt-6 flex justify-center sm:mt-8">
          <SplashWordmark settled={briefingReady} size="display" />
        </div>
      ) : null}
    </div>
  );
}
