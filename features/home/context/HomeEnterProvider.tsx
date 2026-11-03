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
};

export function HomeEnterProvider({
  children,
  phase,
  briefingReady,
  beginSettle,
}: HomeEnterProviderProps) {
  const value = useMemo<HomeEnterContextValue>(
    () => ({ phase, briefingReady, beginSettle }),
    [phase, briefingReady, beginSettle],
  );

  return <HomeEnterContext value={value}>{children}</HomeEnterContext>;
}
