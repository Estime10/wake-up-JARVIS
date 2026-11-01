"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { useTerminalMarkExpand } from "@/features/home/hooks/useTerminalMarkExpand";
import type { TerminalPhase } from "@/features/home/model/terminalPhase";

type UseTerminalSessionResult = {
  open: boolean;
  layer: boolean;
  homeUiHidden: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  toggle: () => void;
  close: () => void;
};

/**
 * Cycle terminal (open → closing → closed) + Esc + focus restore sur le CTA.
 */
export function useTerminalSession(): UseTerminalSessionResult {
  const [phase, setPhase] = useState<TerminalPhase>("closed");
  const modalRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const open = phase === "open";
  const layer = phase === "open" || phase === "closing";
  const homeUiHidden = phase !== "closed";

  const onCloseComplete = useCallback(() => {
    setPhase("closed");
    triggerRef.current?.focus();
  }, []);

  useTerminalMarkExpand({
    open,
    modalRef,
    onCloseComplete,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setPhase("closing");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function toggle(): void {
    if (phase === "closing") {
      return;
    }
    setPhase((current) => (current === "open" ? "closing" : "open"));
  }

  function close(): void {
    if (phase !== "open") {
      return;
    }
    setPhase("closing");
  }

  return {
    open,
    layer,
    homeUiHidden,
    modalRef,
    triggerRef,
    toggle,
    close,
  };
}
