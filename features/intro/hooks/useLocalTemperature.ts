"use client";

import { useSyncExternalStore } from "react";

import { snapshotLocalWeather } from "@/features/intro/model/snapshotLocalWeather";

let sessionCelsius: number | null = null;

function subscribeNoop(): () => void {
  return () => {};
}

function readTempClient(): number {
  if (sessionCelsius === null) {
    sessionCelsius = snapshotLocalWeather().celsius;
  }
  return sessionCelsius;
}

function readTempServer(): null {
  return null;
}

/**
 * Température locale à l'ouverture — figée pour la session.
 * `null` avant hydratation.
 */
export function useLocalTemperature(): number | null {
  return useSyncExternalStore(subscribeNoop, readTempClient, readTempServer);
}
