"use client";

import { useSyncExternalStore } from "react";

import { snapshotInboxMailCount } from "@/features/intro/model/snapshotInboxMailCount";

/**
 * Total mails — fixture stable SSR = client (pas de flash au refresh).
 */
export function useInboxMailCount(): number {
  return useSyncExternalStore(
    () => () => {},
    snapshotInboxMailCount,
    snapshotInboxMailCount,
  );
}
