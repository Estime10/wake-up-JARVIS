"use client";

import { useCallback, useEffect, useRef } from "react";

import { SplashScreen } from "@/features/intro/components/SplashScreen";
import { playSplashExitHandoff } from "@/features/intro/model/playSplashExitHandoff";
import { useJarvisShell } from "@/features/jarvis/context";
import { resetWelcomeSpeakSession } from "@/lib/voice/welcomeSpeak";

type HomeSplashOverlayProps = {
  /** Splash terminé — révéler HUD / input. */
  onFinished: () => void;
};

/**
 * Splash complet sur `/home` (scan, sweep, anneaux, titre…).
 * PersistentMark caché pendant l’anim SVG ; reprise à la fin seulement.
 * Puis l’appelant révèle HUD + input.
 */
export function HomeSplashOverlay({ onFinished }: HomeSplashOverlayProps) {
  const { markRef, handoff } = useJarvisShell();
  const finishingRef = useRef(false);

  // Cacher JarvisMark tant que le SVG splash anime le mark.
  useEffect(() => {
    const mark = markRef.current;
    if (!mark) {
      return undefined;
    }
    mark.style.opacity = "0";
    mark.style.visibility = "hidden";
    mark.style.pointerEvents = "none";
    return () => {
      mark.style.visibility = "";
    };
  }, [markRef]);

  const onComplete = useCallback(() => {
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;

    void (async () => {
      const snapshot = await playSplashExitHandoff(markRef.current);
      if (snapshot) {
        handoff.begin(snapshot);
      } else {
        resetWelcomeSpeakSession();
      }
      onFinished();
    })();
  }, [handoff, markRef, onFinished]);

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60]" aria-hidden>
      <SplashScreen mode="full" onComplete={onComplete} />
    </div>
  );
}
