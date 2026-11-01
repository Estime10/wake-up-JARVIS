"use client";

import { useSyncExternalStore } from "react";

import { greeting } from "@/lib/greeting";
import { t } from "@/lib/i18n";
import { fr } from "@/lib/i18n/messages/fr";

function subscribeNoop(): () => void {
  return () => {};
}

function readGreetingClient(): string {
  return greeting(new Date().getHours());
}

/**
 * Placeholder SSR de même gabarit (évite mount/unmount du salut).
 * Texte volontairement proche du vrai salut.
 */
function readGreetingServer(): string {
  return t("greeting.morning", { name: fr.user.displayName });
}

/**
 * Salut — toujours une string (SSR placeholder → client heure locale).
 * `suppressHydrationWarning` côté UI pour l’écart d’heure.
 */
export function useIntroGreeting(): string {
  return useSyncExternalStore(
    subscribeNoop,
    readGreetingClient,
    readGreetingServer,
  );
}
