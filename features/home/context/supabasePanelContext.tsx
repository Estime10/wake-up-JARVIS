"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SupabasePanelContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const SupabasePanelContext = createContext<SupabasePanelContextValue | null>(
  null,
);

/** Ouverture tiroir Supabase — partagé HUD ↔ AppShell. */
export function SupabasePanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo<SupabasePanelContextValue>(
    () => ({
      open,
      toggle: () => setOpen((current) => !current),
      close: () => setOpen(false),
    }),
    [open],
  );

  return <SupabasePanelContext value={value}>{children}</SupabasePanelContext>;
}

export function useSupabasePanel(): SupabasePanelContextValue {
  const ctx = useContext(SupabasePanelContext);
  if (!ctx) {
    throw new Error(
      "useSupabasePanel doit être utilisé sous SupabasePanelProvider",
    );
  }
  return ctx;
}
