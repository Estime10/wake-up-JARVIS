"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { SplashBackdrop } from "@/features/intro/components/SplashBackdrop";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { SplashMarkStage } from "@/features/intro/components/SplashMarkStage";
import { WakeContinueHint } from "@/features/intro/components/WakeContinueHint";
import { useIntroTimeline } from "@/features/intro/hooks/useIntroTimeline";
import { isPlayableIntroMode, type IntroModeState } from "@/lib/intro/modes";

export type SplashScreenProps = {
  /** `null` = préférences pas encore lues → rendu neutre. */
  mode: IntroModeState;
  onComplete: () => void;
};

function SplashScreenPlaying({
  mode,
  onComplete,
}: {
  mode: "full" | "short";
  onComplete: () => void;
}) {
  const { scopeRef, awaitingWake } = useIntroTimeline({
    mode,
    onComplete,
  });

  return (
    <SplashBackdrop scopeRef={scopeRef}>
      <WakeContinueHint visible={awaitingWake} />
      {/* Splash minimal : wake text only (pas d'équerres / méta HUD). */}
      <SplashHudChrome wakeOnly />
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 sm:gap-10">
        <SplashMarkStage />
      </div>
    </SplashBackdrop>
  );
}

function SplashScreenNone({ onComplete }: { onComplete: () => void }) {
  const doneRef = useRef(false);
  const complete = useEffectEvent(() => {
    if (doneRef.current) {
      return;
    }
    doneRef.current = true;
    onComplete();
  });

  useEffect(() => {
    complete();
  }, []);

  return null;
}

/**
 * Écran d'intro JARVIS — composition UI + hooks.
 * Pas de skip : la timeline va toujours jusqu’au bout.
 */
export function SplashScreen({ mode, onComplete }: SplashScreenProps) {
  if (mode === null) {
    return null;
  }

  if (mode === "none") {
    return <SplashScreenNone onComplete={onComplete} />;
  }

  if (!isPlayableIntroMode(mode)) {
    return null;
  }

  return <SplashScreenPlaying key={mode} mode={mode} onComplete={onComplete} />;
}
