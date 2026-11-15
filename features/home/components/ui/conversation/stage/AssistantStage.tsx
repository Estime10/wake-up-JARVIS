"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import {
  applyMarkClusterFromPose,
  peekMarkClusterFromPose,
} from "@/features/home/model/markClusterFromPose";
import { MarkSlot } from "@/features/jarvis/components/MarkSlot";
import { useJarvisShell } from "@/features/jarvis/context/jarvisShellContext";
import { queryNowPlaying } from "@/features/jarvis/model/markDom";
import {
  MARK_HOME_CHROME_BELOW,
  MARK_HOME_CHROME_BELOW_COMPACT,
  MARK_SLOT_SIZE,
} from "@/features/jarvis/model/markSlotSizes";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { NowPlayingCard } from "@/features/music/NowPlayingCard";
import { cn } from "@/lib/cn";

/**
 * Zone mark (+ wordmark splash uniquement) dans la colonne milieu.
 * Boot : mark grand + E.L.S.A. Settle : mark compact en haut, musique en dessous.
 */
export function AssistantStage() {
  const { phase, briefingReady, bootPlaying } = useHomeEnter();
  const { markRef } = useJarvisShell();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const compact = phase === "settling" || phase === "ready";
  const wordmarkSettled = !bootPlaying && briefingReady;

  useLayoutEffect(() => {
    if (phase !== "settling") {
      return;
    }
    const pose = peekMarkClusterFromPose();
    const stage = stageRef.current;
    if (!pose || !stage) {
      return;
    }
    // Mark en haut = cible stable ; musique déjà en flux (opacity 0) pour le fade.
    const music = queryNowPlaying(stage);
    if (music) {
      gsap.set(music, { opacity: 0 });
    }
    applyMarkClusterFromPose(stage, markRef.current, pose);
  }, [phase, markRef]);

  return (
    <div
      ref={stageRef}
      data-home="assistant-stage"
      className="relative flex min-h-0 w-full max-w-full flex-1 flex-col items-center px-1 pb-22 sm:pb-24"
    >
      <div
        className={cn(
          "relative flex w-full max-w-full flex-col items-center",
          compact
            ? "mt-8 shrink-0 pt-4 sm:mt-10 sm:pt-6"
            : "min-h-0 flex-1 justify-center",
        )}
      >
        <MarkSlot
          name="home"
          className={compact ? MARK_SLOT_SIZE.home : MARK_SLOT_SIZE.splash}
        />
        <div
          className={cn(
            "w-full shrink-0",
            compact ? MARK_HOME_CHROME_BELOW_COMPACT : MARK_HOME_CHROME_BELOW,
          )}
          aria-hidden
        />
        {!compact ? (
          <div className="mt-6 flex w-full justify-center sm:mt-8">
            <SplashWordmark
              bootActive={bootPlaying}
              settled={wordmarkSettled}
              size="display"
            />
          </div>
        ) : null}
      </div>

      {compact ? (
        <div
          data-home="now-playing"
          className="mt-8 flex w-full shrink-0 justify-center sm:mt-10"
        >
          <NowPlayingCard />
        </div>
      ) : null}

      {compact ? <div className="min-h-0 w-full flex-1" aria-hidden /> : null}
    </div>
  );
}
