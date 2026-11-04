"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { SplashScreen } from "@/features/intro/components/SplashScreen";
import { playSplashExitHandoff } from "@/features/intro/model/playSplashExitHandoff";
import { useJarvisShell } from "@/features/jarvis/context";
import { markSplashV1Done } from "@/lib/intro/splashV1Session";
import { SPLASH_HOLD_AT_END } from "@/lib/intro/timings";
import { ROUTES } from "@/lib/routes";
import { prefetchSpeechVoices } from "@/lib/voice/prefetchVoices";
import {
  installOpportunisticAudioUnlock,
  isAudioPlaybackReady,
  resumeUnlockedAudio,
  unlockSpeechFromUserGesture,
  waitForAudioUnlock,
} from "@/lib/voice/speechUnlock";
import { resetWelcomeSpeakSession } from "@/lib/voice/welcomeSpeak";

/**
 * Splash post-auth — un seul JarvisMark jusqu’à `/home`.
 * Sortie : nom JARVIS part → mark reste → navigation → input entre (home).
 */
export function SplashEntry() {
  const router = useRouter();
  const { markRef, handoff, mainFocus } = useJarvisShell();
  const navigatingRef = useRef(false);
  const gestureWaitCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    prefetchSpeechVoices();
    resumeUnlockedAudio();
  }, []);

  useEffect(() => {
    return installOpportunisticAudioUnlock();
  }, []);

  useEffect(() => {
    return () => {
      gestureWaitCleanupRef.current?.();
      gestureWaitCleanupRef.current = null;
    };
  }, []);

  // Mark caché pendant le splash SVG (sauf au moment du handoff).
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

  const goHome = useCallback(() => {
    if (navigatingRef.current) {
      return;
    }
    navigatingRef.current = true;
    gestureWaitCleanupRef.current?.();
    gestureWaitCleanupRef.current = null;

    void (async () => {
      const snapshot = await playSplashExitHandoff(markRef.current);
      if (snapshot) {
        handoff.begin(snapshot);
      } else {
        resetWelcomeSpeakSession();
      }
      markSplashV1Done();
      mainFocus.request();
      router.replace(ROUTES.home);
    })();
  }, [handoff, mainFocus, markRef, router]);

  const onComplete = useCallback(() => {
    if (SPLASH_HOLD_AT_END) {
      return;
    }

    void (async () => {
      resumeUnlockedAudio();
      if (isAudioPlaybackReady()) {
        goHome();
        return;
      }
      // Resume async post-login — court filet avant d’exiger un geste.
      await waitForAudioUnlock(600);
      if (isAudioPlaybackReady()) {
        goHome();
        return;
      }

      // Refresh / session déjà ouverte : 1 geste débloque, puis home (greeting seul).
      const onGesture = () => {
        unlockSpeechFromUserGesture();
        goHome();
      };
      window.addEventListener("pointerdown", onGesture, {
        capture: true,
        once: true,
      });
      window.addEventListener("keydown", onGesture, {
        capture: true,
        once: true,
      });
      gestureWaitCleanupRef.current = () => {
        window.removeEventListener("pointerdown", onGesture, {
          capture: true,
        });
        window.removeEventListener("keydown", onGesture, { capture: true });
      };
    })();
  }, [goHome]);

  return (
    <div className="relative min-h-dvh bg-bg text-text">
      <SplashScreen mode="full" onComplete={onComplete} />
    </div>
  );
}
