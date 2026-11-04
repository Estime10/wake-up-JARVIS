"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

type TerminalSessionContextValue = {
  open: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  toggle: () => void;
  close: () => void;
  openTerminal: () => void;
};

const TerminalSessionContext =
  createContext<TerminalSessionContextValue | null>(null);

/** Session terminal — partagée HUD ↔ intents assistant. */
export function TerminalSessionProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const value = useMemo<TerminalSessionContextValue>(
    () => ({
      open,
      triggerRef,
      toggle: () => {
        setOpen((current) => {
          const next = !current;
          if (!next) {
            queueMicrotask(() => triggerRef.current?.focus());
          }
          return next;
        });
      },
      close: () => {
        setOpen(false);
        triggerRef.current?.focus();
      },
      openTerminal: () => {
        setOpen(true);
      },
    }),
    [open],
  );

  return (
    <TerminalSessionContext value={value}>{children}</TerminalSessionContext>
  );
}

export function useTerminalSession(): TerminalSessionContextValue {
  const ctx = useContext(TerminalSessionContext);
  if (!ctx) {
    throw new Error(
      "useTerminalSession doit être utilisé sous TerminalSessionProvider",
    );
  }
  return ctx;
}
