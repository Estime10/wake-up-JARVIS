"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { SplashV1Scene } from "@/features/intro/components/SplashV1Scene";
import { useSplashV1Timeline } from "@/features/intro/hooks/useSplashV1Timeline";
import { isPlayableIntroMode, type IntroModeState } from "@/lib/intro/modes";

export type SplashScreenProps = {
  /** `null` = préférences pas encore lues → rendu neutre. */
  mode: IntroModeState;
  onComplete: () => void;
};

function SplashScreenPlaying({ onComplete }: { onComplete: () => void }) {
  const { hostRef, onSvgReady } = useSplashV1Timeline({ onComplete });

  return <SplashV1Scene hostRef={hostRef} onSvgReady={onSvgReady} />;
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
 * Écran d'intro JARVIS — UI splash-v1 (SVG = vidéo référence).
 * Muet : le greeting TTS démarre uniquement sur /home.
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

  return <SplashScreenPlaying key={mode} onComplete={onComplete} />;
}
