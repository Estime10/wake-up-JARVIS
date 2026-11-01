"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type RepoPanelContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const RepoPanelContext = createContext<RepoPanelContextValue | null>(null);

/** Ouverture panneau REPO — partagé HUD ↔ AppShell (domaine home, pas lib). */
export function RepoPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo<RepoPanelContextValue>(
    () => ({
      open,
      toggle: () => setOpen((current) => !current),
      close: () => setOpen(false),
    }),
    [open],
  );

  return <RepoPanelContext value={value}>{children}</RepoPanelContext>;
}

export function useRepoPanel(): RepoPanelContextValue {
  const ctx = useContext(RepoPanelContext);
  if (!ctx) {
    throw new Error("useRepoPanel must be used within RepoPanelProvider");
  }
  return ctx;
}
