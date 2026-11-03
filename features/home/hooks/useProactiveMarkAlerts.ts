"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import type { AssistantState } from "@/features/home/model/assistantMachine";
import {
  spokenMailArrival,
  spokenSysPressureChange,
} from "@/features/home/model/spokenProactiveAlerts";
import { useMailFeed } from "@/features/mail/MailFeedProvider";
import { useSysPressure } from "@/lib/hooks/useSysPressure";
import type { SysPressureState } from "@/features/intro/model/sysPressureState";

type UseProactiveMarkAlertsArgs = {
  /** Home settled — pas pendant le briefing. */
  enabled: boolean;
  assistantState: AssistantState;
  /** Voix + anneau speaking (sans bloquer le welcome one-shot). */
  speakAlert: (text: string) => Promise<boolean>;
};

const CPU_MIN_GAP_MS = 8_000;
const FLUSH_RETRY_MS = 900;

/**
 * Le mask annonce seul : nouveaux mails + changement CPU.
 * File d’attente si l’assistant est occupé — jamais de clic requis.
 */
export function useProactiveMarkAlerts({
  enabled,
  assistantState,
  speakAlert,
}: UseProactiveMarkAlertsArgs): void {
  const { mails, status: mailStatus } = useMailFeed();
  const sysPressure = useSysPressure();

  const seenMailIdsRef = useRef<Set<string> | null>(null);
  const lastCpuRef = useRef<SysPressureState | null>(null);
  const lastCpuAnnounceAtRef = useRef(0);
  const queueRef = useRef<string[]>([]);
  const flushingRef = useRef(false);

  const enqueue = useEffectEvent((text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }
    if (queueRef.current[queueRef.current.length - 1] === trimmed) {
      return;
    }
    queueRef.current.push(trimmed);
  });

  const flush = useEffectEvent(async () => {
    if (!enabled || flushingRef.current) {
      return;
    }
    if (document.visibilityState !== "visible") {
      return;
    }
    if (assistantState !== "idle") {
      return;
    }
    const next = queueRef.current[0];
    if (!next) {
      return;
    }

    flushingRef.current = true;
    try {
      const ok = await speakAlert(next);
      if (ok) {
        queueRef.current.shift();
      }
    } finally {
      flushingRef.current = false;
    }
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void flush();
    if (queueRef.current.length === 0 || assistantState !== "idle") {
      return undefined;
    }
    const id = window.setInterval(() => {
      void flush();
    }, FLUSH_RETRY_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [enabled, assistantState]);

  useEffect(() => {
    if (!enabled || mailStatus !== "ready") {
      return;
    }

    const ids = new Set(mails.map((mail) => mail.id));
    if (seenMailIdsRef.current === null) {
      seenMailIdsRef.current = ids;
      return;
    }

    const newcomers = mails.filter(
      (mail) => !seenMailIdsRef.current!.has(mail.id),
    );
    seenMailIdsRef.current = ids;

    const phrase = spokenMailArrival(newcomers);
    if (phrase) {
      enqueue(phrase);
      void flush();
    }
  }, [enabled, mailStatus, mails]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (lastCpuRef.current === null) {
      lastCpuRef.current = sysPressure;
      return;
    }

    if (lastCpuRef.current === sysPressure) {
      return;
    }

    lastCpuRef.current = sysPressure;
    const phrase = spokenSysPressureChange(sysPressure);
    if (!phrase) {
      return;
    }

    const now = Date.now();
    if (now - lastCpuAnnounceAtRef.current < CPU_MIN_GAP_MS) {
      return;
    }
    lastCpuAnnounceAtRef.current = now;
    enqueue(phrase);
    void flush();
  }, [enabled, sysPressure]);
}
