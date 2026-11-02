"use client";

import { useLayoutEffect, useState, type CSSProperties } from "react";

import { MAIN_LANDMARK_ID } from "@/features/home/model/landmarks";

export type MainSectionBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/** Style `fixed` calé sur la bbox de `<main>` (pas le side panel). */
export function mainSectionBoxStyle(
  box: MainSectionBox | null,
): CSSProperties | undefined {
  if (!box) {
    return undefined;
  }
  return {
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
  };
}

/**
 * Mesure la colonne `main` — resize sync quand `active` (overlay / terminal ouvert).
 */
export function useMainSectionBox(active: boolean): MainSectionBox | null {
  const [box, setBox] = useState<MainSectionBox | null>(null);

  useLayoutEffect(() => {
    function sync(): void {
      const main = document.getElementById(MAIN_LANDMARK_ID);
      if (!main) {
        return;
      }
      const rect = main.getBoundingClientRect();
      setBox({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }

    sync();
    if (!active) {
      return;
    }

    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [active]);

  return box;
}
