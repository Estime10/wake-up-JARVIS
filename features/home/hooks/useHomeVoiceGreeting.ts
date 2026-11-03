"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef } from "react";

import { usePorts } from "@/app/ports-context";
import { useJarvisShell } from "@/features/jarvis/context";
import { resolveDisplayName } from "@/features/profile/model/resolveDisplayName";
import { spokenGreeting } from "@/lib/greeting";
import {
  getWelcomeSpeakText,
  setWelcomeSpeakText,
  wasWelcomeSpeakPlayed,
} from "@/lib/voice/welcomeSpeak";

type UseHomeVoiceGreetingArgs = {
  speakWelcome: (text: string) => Promise<boolean>;
};

/**
 * Aligne l’anneau speaking sur le TTS (démarré par useHomeEnterMotion).
 */
export function useHomeVoiceGreeting({
  speakWelcome,
}: UseHomeVoiceGreetingArgs): void {
  const { profile } = usePorts();
  const { handoff } = useJarvisShell();
  const ranRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const hour = new Date().getHours();
    setWelcomeSpeakText(spokenGreeting(hour));

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
        /* fallback i18n */
      });

    return () => {
      cancelled = true;
    };
  }, [profile]);

  const run = useEffectEvent(async () => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const ok = await speakWelcome(getWelcomeSpeakText());
      if (ok || wasWelcomeSpeakPlayed()) {
        return;
      }
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 400);
      });
    }
  });

  useLayoutEffect(() => {
    return handoff.onEnterComplete(() => {
      void run();
    });
  }, [handoff]);
}
