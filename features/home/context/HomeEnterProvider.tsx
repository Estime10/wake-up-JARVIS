"use client";

import { useMemo, type ReactNode } from "react";

import {
  HomeEnterContext,
  type HomeEnterContextValue,
} from "@/features/home/context/homeEnterContext";
import type { HomeEnterPhase } from "@/features/home/model/homeEnterPhase";

type HomeEnterProviderProps = {
  children: ReactNode;
  phase: HomeEnterPhase;
  briefingReady: boolean;
  beginSettle: () => void;
  skipCenteredBriefing: boolean;
};

export function HomeEnterProvider({
  children,
  phase,
  briefingReady,
  beginSettle,
  skipCenteredBriefing,
}: HomeEnterProviderProps) {
  const value = useMemo<HomeEnterContextValue>(
    () => ({ phase, briefingReady, beginSettle, skipCenteredBriefing }),
    [phase, briefingReady, beginSettle, skipCenteredBriefing],
  );

  return <HomeEnterContext value={value}>{children}</HomeEnterContext>;
}
