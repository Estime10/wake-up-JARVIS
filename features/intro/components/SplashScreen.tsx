"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { SplashBackdrop } from "@/features/intro/components/SplashBackdrop";
import { SplashGreeting } from "@/features/intro/components/SplashGreeting";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { SplashMarkStage } from "@/features/intro/components/SplashMarkStage";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { useIntroGreeting } from "@/features/intro/hooks/useIntroGreeting";
import { useIntroTimeline } from "@/features/intro/hooks/useIntroTimeline";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { isPlayableIntroMode, type IntroModeState } from "@/lib/intro/modes";

export type SplashScreenProps = {
  /** `null` = préférences pas encore lues → rendu neutre. */
  mode: IntroModeState;
  onComplete: () => void;
};

function SplashScreenPlaying({
  mode,
  reducedMotion,
  onComplete,
}: {
  mode: "full" | "short";
  reducedMotion: boolean;
  onComplete: () => void;
}) {
  const greetingText = useIntroGreeting();
  const { scopeRef, skip } = useIntroTimeline({
    mode,
    reducedMotion,
    greetingReady: true,
    onComplete,
  });

  return (
    <SplashBackdrop scopeRef={scopeRef} onSkip={skip}>
      <SplashHudChrome />
      <div
        className="relative z-10 flex flex-col items-center gap-8 px-6 sm:gap-10"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <SplashMarkStage />
        <div className="flex min-h-16 flex-col items-center justify-center gap-2">
          <SplashWordmark />
          <SplashGreeting text={greetingText} />
        </div>
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
 * Animation = timeline GSAP (hooks + model), pas une suite d'états React.
 */
export function SplashScreen({ mode, onComplete }: SplashScreenProps) {
  const reducedMotion = usePrefersReducedMotion();

  if (mode === null) {
    return null;
  }

  if (mode === "none") {
    return <SplashScreenNone onComplete={onComplete} />;
  }

  if (!isPlayableIntroMode(mode)) {
    return null;
  }

  return (
    <SplashScreenPlaying
      key={`${mode}-${reducedMotion ? "reduced" : "motion"}`}
      mode={mode}
      reducedMotion={reducedMotion}
      onComplete={onComplete}
    />
  );
}
