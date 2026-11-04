"use client";

import { createContext, useContext } from "react";

import type { HomeEnterPhase } from "@/features/home/model/homeEnterPhase";

export type HomeEnterContextValue = {
  phase: HomeEnterPhase;
  /** Mark + JARVIS en place — le TTS peut démarrer. */
  briefingReady: boolean;
  /** Après le TTS briefing — lance shrink mark + Flip JARVIS + reveal UI. */
  beginSettle: () => void;
  /** Splash SVG v1 déjà vu — pas de mark géant centré (2e splash). */
  skipCenteredBriefing: boolean;
};

const HomeEnterContext = createContext<HomeEnterContextValue | null>(null);

export function useHomeEnter(): HomeEnterContextValue {
  const value = useContext(HomeEnterContext);
  if (!value) {
    throw new Error("useHomeEnter doit être utilisé sous HomeEnterProvider");
  }
  return value;
}

export { HomeEnterContext };
