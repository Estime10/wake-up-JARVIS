"use client";

import { useSyncExternalStore } from "react";

import { formatIntroClock } from "@/features/intro/model/formatIntroClock";

function subscribeClock(onStoreChange: () => void): () => void {
  const id = window.setInterval(onStoreChange, 30_000);
  return () => {
    window.clearInterval(id);
  };
}

function readClockClient(): string {
  return formatIntroClock(new Date());
}

function readClockServer(): null {
  return null;
}

/**
 * Horloge HUD après hydratation.
 * `null` côté serveur / snapshot → pas d'écart d'hydratation.
 */
export function useIntroClock(): string | null {
  return useSyncExternalStore(subscribeClock, readClockClient, readClockServer);
}
