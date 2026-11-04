"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { usePorts } from "@/app/ports-context";
import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import { useMailFeed } from "@/features/mail/MailFeedProvider";
import { resolveDisplayName } from "@/features/profile/model/resolveDisplayName";
import { spokenBriefing } from "@/lib/greeting";
import { useDeviceLocation } from "@/lib/hooks/useDeviceLocation";
import { t } from "@/lib/i18n";
import { countMailsToday } from "@/lib/mail/countMailsToday";
import {
  installOpportunisticAudioUnlock,
  resumeUnlockedAudio,
  waitForAudioUnlock,
} from "@/lib/voice/speechUnlock";
import {
  setWelcomeSpeakText,
  waitWelcomeSpeakEnd,
  wasWelcomeSpeakPlayed,
} from "@/lib/voice/welcomeSpeak";

type UseHomeVoiceGreetingArgs = {
  speakWelcome: (text: string) => Promise<boolean>;
};

type UseHomeVoiceGreetingResult = {
  /** `true` une fois la tentative de salut terminée (succès ou échec). */
  greetingDone: boolean;
};

const MAIL_WAIT_MS = 600;
const GEO_WAIT_MS = 800;
/** Filet : ne jamais bloquer indéfiniment sur le TTS. */
const BRIEFING_MAX_MS = 20_000;
/** Court : le splash / login a déjà dû unlock — on ne bloque pas le speak. */
const AUDIO_UNLOCK_WAIT_MS = 800;

/**
 * Briefing vocal après `briefingReady`.
 * Settle UI tout de suite (messages) — TTS en parallèle.
 * Alertes proactives : attendre `greetingDone` (ne pas voler idle).
 */
export function useHomeVoiceGreeting({
  speakWelcome,
}: UseHomeVoiceGreetingArgs): UseHomeVoiceGreetingResult {
  const { profile } = usePorts();
  const { mails, status: mailStatus } = useMailFeed();
  const { place, status: geoStatus } = useDeviceLocation();
  const { phase, briefingReady, beginSettle } = useHomeEnter();
  const ranRef = useRef(false);
  const [greetingDone, setGreetingDone] = useState(false);

  useEffect(() => {
    return installOpportunisticAudioUnlock();
  }, []);

  const runBriefing = useEffectEvent(async () => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    const now = new Date();
    let name = t("user.displayName");
    try {
      const row = await profile.getProfile();
      if (row) {
        name = resolveDisplayName(row.displayName, row.username);
      }
    } catch {
      /* fallback */
    }

    const mailReady = mailStatus === "ready";
    const mailTotal = mailReady ? mails.length : 0;
    const mailToday = mailReady ? countMailsToday(mails) : 0;

    const text = spokenBriefing({
      name,
      at: now,
      place,
      mailTotal,
      mailToday,
    });
    setWelcomeSpeakText(text);

    // UI home d’abord — ne pas attendre le TTS pour les messages.
    beginSettle();

    resumeUnlockedAudio();

    try {
      await Promise.race([
        (async () => {
          // Filet court puis speak quand même (repli navigateur si Piper suspendu).
          await waitForAudioUnlock(AUDIO_UNLOCK_WAIT_MS);
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
      /* TTS optionnel */
    } finally {
      setGreetingDone(true);
    }
  });

  useEffect(() => {
    if (phase !== "briefing" || !briefingReady || ranRef.current) {
      return undefined;
    }

    const mailReady = mailStatus !== "loading";
    const geoReady = geoStatus !== "pending";
    if (mailReady && geoReady) {
      void runBriefing();
      return undefined;
    }

    const waitMs = Math.max(
      mailReady ? 0 : MAIL_WAIT_MS,
      geoReady ? 0 : GEO_WAIT_MS,
    );
    const timeoutId = window.setTimeout(() => {
      void runBriefing();
    }, waitMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [phase, briefingReady, mailStatus, mails, geoStatus, place]);

  return { greetingDone };
}
