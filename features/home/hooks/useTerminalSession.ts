"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

type UseTerminalSessionResult = {
  open: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  toggle: () => void;
  close: () => void;
};

/**
 * Session terminal — ouverture centrée dans la colonne main, sans expand mark.
 */
export function useTerminalSession(): UseTerminalSessionResult {
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

  function toggle(): void {
    setOpen((current) => {
      const next = !current;
      if (!next) {
        queueMicrotask(() => triggerRef.current?.focus());
      }
      return next;
    });
  }

  function close(): void {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return {
    open,
    triggerRef,
    toggle,
    close,
  };
}
