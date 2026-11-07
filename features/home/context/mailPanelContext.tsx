"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MailPanelContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
  openPanel: () => void;
};

const MailPanelContext = createContext<MailPanelContextValue | null>(null);

/** Ouverture tiroir mails — partagé HUD ↔ AppShell. */
export function MailPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo<MailPanelContextValue>(
    () => ({
      open,
      toggle: () => setOpen((current) => !current),
      close: () => setOpen(false),
      openPanel: () => setOpen(true),
    }),
    [open],
  );

  return <MailPanelContext value={value}>{children}</MailPanelContext>;
}

export function useMailPanel(): MailPanelContextValue {
  const ctx = useContext(MailPanelContext);
  if (!ctx) {
    throw new Error("useMailPanel doit être utilisé sous MailPanelProvider");
  }
  return ctx;
}
