"use client";

import { useSyncExternalStore } from "react";

import { useDisplayName } from "@/features/profile/hooks/useDisplayName";
import { greeting } from "@/lib/greeting";

function subscribeNoop(): () => void {
  return () => {};
}

function readHourClient(): number {
  return new Date().getHours();
}

/** Placeholder SSR — heure matin pour gabarit stable. */
function readHourServer(): number {
  return 9;
}

/**
 * Salut — heure locale + `display_name` profil (fallback i18n).
 * `suppressHydrationWarning` côté UI pour l’écart d’heure / nom.
 */
export function useIntroGreeting(): string {
  const name = useDisplayName();
  const hour = useSyncExternalStore(
    subscribeNoop,
    readHourClient,
    readHourServer,
  );
  return greeting(hour, name);
}
