"use client";

import { useSyncExternalStore } from "react";

import { snapshotInboxMailCount } from "@/features/intro/model/snapshotInboxMailCount";

let sessionSnapshot: number | null = null;

function subscribeNoop(): () => void {
  return () => {};
}

function readCountClient(): number {
  if (sessionSnapshot === null) {
    sessionSnapshot = snapshotInboxMailCount();
  }
  return sessionSnapshot;
}

function readCountServer(): null {
  return null;
}

/**
 * Total mails reçus à l'ouverture — figé pour la session.
 * `null` avant hydratation (pas d'écart SSR).
 */
export function useInboxMailCount(): number | null {
  return useSyncExternalStore(subscribeNoop, readCountClient, readCountServer);
}
