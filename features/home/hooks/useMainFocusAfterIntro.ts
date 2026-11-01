"use client";

import { useEffect, useRef, type RefObject } from "react";

import { useJarvisShell } from "@/features/jarvis/jarvisShellContext";

/**
 * Après l'intro (fin ou « Passer »), place le focus sur `<main>`
 * plutôt que de le laisser retomber sur `body`.
 */
export function useMainFocusAfterIntro(): RefObject<HTMLElement | null> {
  const mainRef = useRef<HTMLElement | null>(null);
  const { mainFocus } = useJarvisShell();

  useEffect(() => {
    if (mainFocus.consume()) {
      mainRef.current?.focus({ preventScroll: true });
    }
  }, [mainFocus]);

  return mainRef;
}
