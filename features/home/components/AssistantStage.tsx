"use client";

import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import { MarkSlot } from "@/features/jarvis/components/MarkSlot";
import { MARK_SLOT_SIZE } from "@/features/jarvis/model/markSlotSizes";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { cn } from "@/lib/cn";

/**
 * Zone mark + JARVIS (toujours monté pour Flip settle).
 * États vocaux = anneau uniquement.
 */
export function AssistantStage() {
  const { phase, briefingReady } = useHomeEnter();
  const briefing = phase === "briefing";
  // Après révélation GSAP : settled pour ne pas retomber sur opacity-0 CSS.
  const wordmarkVisible = briefingReady || !briefing;

  return (
    <div className="flex w-full max-w-full flex-col items-center">
      <MarkSlot
        name={briefing ? "splash" : "home"}
        className={briefing ? MARK_SLOT_SIZE.splash : MARK_SLOT_SIZE.home}
      />

      <div
        className={cn(
          "flex justify-center",
          briefing ? "mt-6 sm:mt-8" : "mt-3 sm:mt-4",
        )}
      >
        <SplashWordmark
          settled={wordmarkVisible}
          size={briefing ? "display" : "home"}
        />
      </div>
    </div>
  );
}
