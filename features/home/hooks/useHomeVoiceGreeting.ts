"use client";

import { useEffect, useEffectEvent, useRef } from "react";

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

const MAIL_WAIT_MS = 600;
const GEO_WAIT_MS = 800;
/** Filet : ne jamais bloquer le settle si le TTS pend. */
const BRIEFING_MAX_MS = 45_000;
/** Attente max d’un geste (filet) avant de parler — splash a déjà unlock. */
const AUDIO_UNLOCK_WAIT_MS = 1_500;

/**
 * Briefing vocal (HUD) → toujours `beginSettle` ensuite.
 * Contenu : salut, date/heure, géoloc, mails total + jour, système OK.
 * Déclenché uniquement sur home après `briefingReady` (jamais pendant le splash).
 */
export function useHomeVoiceGreeting({
  speakWelcome,
}: UseHomeVoiceGreetingArgs): void {
  const { profile } = usePorts();
  const { mails, status: mailStatus } = useMailFeed();
  const { place, status: geoStatus } = useDeviceLocation();
  const { phase, briefingReady, beginSettle } = useHomeEnter();
  const ranRef = useRef(false);

  useEffect(() => {
    // Filet si le splash n’a pas reçu de geste — unlock only, pas de TTS.
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

    // UI home d’abord (HUD / messages / composer) — TTS en parallèle.
    beginSettle();

    try {
      await Promise.race([
        (async () => {
          // Audio déjà débloqué au login / clic splash → Piper part seul ici.
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
      /* TTS optionnel après settle */
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
}
