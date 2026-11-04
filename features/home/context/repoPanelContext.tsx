"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type RepoPanelContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  openPanel: () => void;
  /** Requête de focus dépôt (nom / owner/repo) — consommée par le panneau live. */
  focusRepoQuery: string | null;
  focusRepo: (query: string) => void;
  clearFocusRepo: () => void;
};

const RepoPanelContext = createContext<RepoPanelContextValue | null>(null);

/** Ouverture panneau REPO — partagé HUD ↔ AppShell ↔ assistant. */
export function RepoPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [focusRepoQuery, setFocusRepoQuery] = useState<string | null>(null);

  const clearFocusRepo = useCallback(() => {
    setFocusRepoQuery(null);
  }, []);

  const value = useMemo<RepoPanelContextValue>(
    () => ({
      open,
      toggle: () => setOpen((current) => !current),
      close: () => setOpen(false),
      openPanel: () => setOpen(true),
      focusRepoQuery,
      focusRepo: (query: string) => {
        setFocusRepoQuery(query.trim());
        setOpen(true);
      },
      clearFocusRepo,
    }),
    [open, focusRepoQuery, clearFocusRepo],
  );

  return <RepoPanelContext value={value}>{children}</RepoPanelContext>;
}

export function useRepoPanel(): RepoPanelContextValue {
  const ctx = useContext(RepoPanelContext);
  if (!ctx) {
    throw new Error("useRepoPanel doit être utilisé sous RepoPanelProvider");
  }
  return ctx;
}
