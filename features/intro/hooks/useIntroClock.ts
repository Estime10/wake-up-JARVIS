"use client";

import { useSyncExternalStore } from "react";

import { formatIntroClock } from "@/features/intro/model/formatIntroClock";
import { t } from "@/lib/i18n";

function subscribeClock(onStoreChange: () => void): () => void {
  const id = window.setInterval(onStoreChange, 30_000);
  return () => {
    window.clearInterval(id);
  };
}

function readClockClient(): string {
  return formatIntroClock(new Date());
}

/** Placeholder stable — même string SSR / 1er client avant tick. */
function readClockServer(): string {
  return t("intro.clockPlaceholder");
}

/**
 * Horloge HUD.
 * SSR et hydratation : placeholder ; le vrai horaire après mount (pas de null).
 */
export function useIntroClock(): string {
  return useSyncExternalStore(subscribeClock, readClockClient, readClockServer);
}
