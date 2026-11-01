"use client";

import { useEffect } from "react";

/** Échap / frappe / Entrée → skip (ne consomme pas l'événement). */
export function useSkipHotkeys(onSkip: () => void): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" ||
        event.key.length === 1 ||
        event.key === "Enter"
      ) {
        onSkip();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onSkip]);
}
