"use client";

import { useSyncExternalStore } from "react";

import { greeting } from "@/lib/greeting";

function subscribeNoop(): () => void {
  return () => {};
}

function readGreetingClient(): string {
  return greeting(new Date().getHours());
}

function readGreetingServer(): null {
  return null;
}

/**
 * Salut après hydratation (heure locale).
 * `null` côté serveur / snapshot → pas d'écart d'hydratation.
 */
export function useIntroGreeting(): string | null {
  return useSyncExternalStore(
    subscribeNoop,
    readGreetingClient,
    readGreetingServer,
  );
}
