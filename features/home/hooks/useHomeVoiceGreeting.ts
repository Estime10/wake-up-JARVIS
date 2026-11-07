"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";

import { usePorts } from "@/app/ports-context";
import { useHomeEnter } from "@/features/home/context/homeEnterContext";
import { useMailFeed } from "@/features/mail/MailFeedProvider";
import { resolveDisplayName } from "@/features/profile/model/resolveDisplayName";
import { spokenBriefing } from "@/lib/greeting";
import { t } from "@/lib/i18n";
import { countMailsToday } from "@/lib/mail/countMailsToday";
import { pickUserHonorific } from "@/lib/user/userHonorific";
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
  const {
    phase,
    briefingReady,
    beginSettle,
    skipCenteredBriefing,
    bootPlaying,
  } = useHomeEnter();
  const ranRef = useRef(false);
  const settleStartedRef = useRef(false);
  const [greetingDone, setGreetingDone] = useState(false);

  useEffect(() => {
    return installOpportunisticAudioUnlock();
  }, []);

  // Après boot (scan+nom) : settle UI tout de suite — sans attendre mail/TTS.
  useEffect(() => {
    if (
      bootPlaying ||
      !skipCenteredBriefing ||
      phase !== "briefing" ||
      !briefingReady ||
      settleStartedRef.current
    ) {
      return;
    }
    settleStartedRef.current = true;
    beginSettle();
  }, [bootPlaying, skipCenteredBriefing, phase, briefingReady, beginSettle]);

  const runBriefing = useEffectEvent(async () => {
    if (ranRef.current) {
      return;
    }
    ranRef.current = true;

    const now = new Date();
    let name: string = pickUserHonorific();
    try {
      const row = await profile.getProfile();
      if (row) {
        const resolved = resolveDisplayName(row.displayName, row.username);
        // Profil perso prioritaire ; sinon honorifique aléatoire (plus DevinChat).
        if (resolved !== t("user.displayName")) {
          name = resolved;
        }
      }
    } catch {
      /* fallback honorifique */
    }

    const mailReady = mailStatus === "ready";
    const mailToday = mailReady ? countMailsToday(mails) : 0;

    const text = spokenBriefing({
      name,
      at: now,
      mailToday,
    });
    setWelcomeSpeakText(text);

    // Legacy : settle après data. Splash v1 déjà settlé au mount.
    if (!settleStartedRef.current) {
      settleStartedRef.current = true;
      beginSettle();
    }

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
    if (mailReady) {
      void runBriefing();
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      void runBriefing();
    }, MAIL_WAIT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [phase, briefingReady, mailStatus, mails]);

  return { greetingDone };
}
