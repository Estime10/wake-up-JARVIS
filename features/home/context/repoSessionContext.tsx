"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  useRepoPanelSession,
  type RepoPanelSession,
} from "@/features/home/hooks/useRepoPanelSession";

const RepoSessionContext = createContext<RepoPanelSession | null>(null);

type RepoSessionProviderProps = {
  panelOpen: boolean;
  children: ReactNode;
};

/** Session mock (scénario, arbre, aperçu) — évite le prop drilling tiroir. */
export function RepoSessionProvider({
  panelOpen,
  children,
}: RepoSessionProviderProps) {
  const session = useRepoPanelSession({ panelOpen });
  return <RepoSessionContext value={session}>{children}</RepoSessionContext>;
}

export function useRepoSession(): RepoPanelSession {
  const ctx = useContext(RepoSessionContext);
  if (!ctx) {
    throw new Error(
      "useRepoSession doit être utilisé sous RepoSessionProvider",
    );
  }
  return ctx;
}
