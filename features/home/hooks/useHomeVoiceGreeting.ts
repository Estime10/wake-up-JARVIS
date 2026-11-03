"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { usePorts } from "@/app/ports-context";
import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import { useMailFeed } from "@/features/mail/MailFeedProvider";
import { resolveDisplayName } from "@/features/profile/model/resolveDisplayName";
import { spokenBriefing } from "@/lib/greeting";
import { t } from "@/lib/i18n";
import { countMailsToday } from "@/lib/mail/countMailsToday";
import {
  setWelcomeSpeakText,
  waitWelcomeSpeakEnd,
  wasWelcomeSpeakPlayed,
} from "@/lib/voice/welcomeSpeak";

type UseHomeVoiceGreetingArgs = {
  speakWelcome: (text: string) => Promise<boolean>;
};

const MAIL_WAIT_MS = 2000;
/** Filet : ne jamais bloquer le settle si le TTS pend. */
const BRIEFING_MAX_MS = 12_000;

/**
 * Briefing vocal → toujours `beginSettle` ensuite (même si TTS échoue / timeoute).
 */
export function useHomeVoiceGreeting({
  speakWelcome,
}: UseHomeVoiceGreetingArgs): void {
  const { profile } = usePorts();
  const { mails, status: mailStatus } = useMailFeed();
  const { phase, briefingReady, beginSettle } = useHomeEnter();
  const ranRef = useRef(false);

  const runBriefing = useEffectEvent(async () => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    const hour = new Date().getHours();
    let name = t("user.displayName");
    try {
      const row = await profile.getProfile();
      if (row) {
        name = resolveDisplayName(row.displayName, row.username);
      }
    } catch {
      /* fallback */
    }

    const todayCount = countMailsToday(mails);
    const text = spokenBriefing(hour, name, todayCount);
    setWelcomeSpeakText(text);

    try {
      await Promise.race([
        (async () => {
          const ok = await speakWelcome(text);
          if (!ok && !wasWelcomeSpeakPlayed()) {
            await waitWelcomeSpeakEnd();
          }
        })(),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, BRIEFING_MAX_MS);
        }),
      ]);
    } catch {
      /* settle quand même */
    }

    beginSettle();
  });

  useEffect(() => {
    // Attendre mark + JARVIS visibles avant TTS.
    if (phase !== "briefing" || !briefingReady || ranRef.current) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void runBriefing();
    }, MAIL_WAIT_MS);

    if (mailStatus !== "loading") {
      window.clearTimeout(timeoutId);
      void runBriefing();
      return undefined;
    }

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [phase, briefingReady, mailStatus, mails]);
}
