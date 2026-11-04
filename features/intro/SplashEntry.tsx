"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { SplashScreen } from "@/features/intro/components/SplashScreen";
import { captureSplashMarkHandoff } from "@/features/intro/model/captureSplashMarkHandoff";
import { useJarvisShell } from "@/features/jarvis/context";
import { markSplashV1Done } from "@/lib/intro/splashV1Session";
import { SPLASH_HOLD_AT_END } from "@/lib/intro/timings";
import { ROUTES } from "@/lib/routes";
import { prefetchSpeechVoices } from "@/lib/voice/prefetchVoices";
import { installOpportunisticAudioUnlock } from "@/lib/voice/speechUnlock";
import { resetWelcomeSpeakSession } from "@/lib/voice/welcomeSpeak";

/**
 * Splash post-auth — UI v1, muet, puis handoff Flip du même mark vers `/home`.
 */
export function SplashEntry() {
  const router = useRouter();
  const { markRef, handoff, mainFocus } = useJarvisShell();

  useEffect(() => {
    prefetchSpeechVoices();
  }, []);

  useEffect(() => {
    return installOpportunisticAudioUnlock();
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

  const onComplete = useCallback(() => {
    if (SPLASH_HOLD_AT_END) {
      return;
    }
    const snapshot = captureSplashMarkHandoff(markRef.current);
    if (snapshot) {
      handoff.begin(snapshot);
    } else {
      resetWelcomeSpeakSession();
    }
    markSplashV1Done();
    mainFocus.request();
    router.replace(ROUTES.home);
  }, [handoff, mainFocus, markRef, router]);

  return (
    <div className="relative min-h-dvh bg-bg text-text">
      <SplashScreen mode="full" onComplete={onComplete} />
    </div>
  );
}
