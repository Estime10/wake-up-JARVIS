"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { usePorts } from "@/app/ports-context";
import { SplashScreen } from "@/features/intro/components/SplashScreen";
import { useJarvisShell } from "@/features/jarvis/context";
import { captureSplashSnapshot } from "@/features/jarvis/model/homeEnterHandoff";
import { resolveDisplayName } from "@/features/profile/model/resolveDisplayName";
import { spokenGreeting } from "@/lib/greeting";
import { prefersReducedMotion } from "@/lib/motion/reducedMotion";
import { ROUTES } from "@/lib/routes";
import { prefetchSpeechVoices } from "@/lib/voice/prefetchVoices";
import { setWelcomeSpeakText } from "@/lib/voice/welcomeSpeak";

/**
 * Splash post-auth — intro complète puis `/home`.
 * (Le gate anonyme → login est côté `app/page.tsx`.)
 */
export function SplashEntry() {
  const router = useRouter();
  const { profile } = usePorts();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { markRef, handoff, mainFocus } = useJarvisShell();

  useEffect(() => {
    prefetchSpeechVoices();
    const hour = new Date().getHours();
    setWelcomeSpeakText(spokenGreeting(hour));

    let cancelled = false;
    void profile
      .getProfile()
      .then((row) => {
        if (cancelled || !row) {
          return;
        }
        setWelcomeSpeakText(
          spokenGreeting(
            hour,
            resolveDisplayName(row.displayName, row.username),
          ),
        );
      })
      .catch(() => {
        /* fallback i18n déjà posé */
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  const onComplete = useCallback(() => {
    const root = rootRef.current;
    if (root && !prefersReducedMotion()) {
      handoff.begin(captureSplashSnapshot(markRef.current, root));
    }
    mainFocus.request();
    router.replace(ROUTES.home);
  }, [handoff, mainFocus, markRef, router]);

  return (
    <div ref={rootRef} className="relative min-h-dvh bg-bg text-text">
      <SplashScreen mode="full" onComplete={onComplete} />
    </div>
  );
}
