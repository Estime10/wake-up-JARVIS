"use client";

import { useSyncExternalStore } from "react";

import {
  formatIntroDate,
  formatIntroTime,
} from "@/features/intro/model/formatIntroClock";
import { t } from "@/lib/i18n";

type IntroClockParts = {
  time: string;
  date: string;
};

/** Snapshot serveur stable — `getServerSnapshot` ne doit pas allouer à chaque appel. */
const SERVER_SNAPSHOT: IntroClockParts = {
  time: t("intro.clockPlaceholder"),
  date: "",
};

let clientSnapshot: IntroClockParts = SERVER_SNAPSHOT;

function subscribeClock(onStoreChange: () => void): () => void {
  const id = window.setInterval(() => {
    const next = readNow();
    if (
      next.time !== clientSnapshot.time ||
      next.date !== clientSnapshot.date
    ) {
      clientSnapshot = next;
      onStoreChange();
    }
  }, 30_000);
  return () => {
    window.clearInterval(id);
  };
}

function readNow(): IntroClockParts {
  const now = new Date();
  return {
    time: formatIntroTime(now),
    date: formatIntroDate(now),
  };
}

function readClient(): IntroClockParts {
  const next = readNow();
  if (next.time !== clientSnapshot.time || next.date !== clientSnapshot.date) {
    clientSnapshot = next;
  }
  return clientSnapshot;
}

function readServer(): IntroClockParts {
  return SERVER_SNAPSHOT;
}

/**
 * Heure + date séparées pour la ligne HUD.
 */
export function useIntroClockParts(): IntroClockParts {
  return useSyncExternalStore(subscribeClock, readClient, readServer);
}
