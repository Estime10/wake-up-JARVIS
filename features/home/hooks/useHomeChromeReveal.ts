"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { RefObject } from "react";

import { useJarvisShell } from "@/features/jarvis/context";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";

gsap.registerPlugin(useGSAP);

/**
 * Équerres + méta HUD.
 * - Handoff / entrée directe : opacity 0 initiale ; les timelines
 *   `playHomeEnter*` les révèlent au landing du mark.
 * - Reduced motion : visibles tout de suite.
 */
export function useHomeChromeReveal(
  chromeRef: RefObject<HTMLElement | null>,
): void {
  const { handoff } = useJarvisShell();

  useGSAP((owner) => {
    const el = chromeRef.current;
    if (!el) {
      return undefined;
    }

    return matchReducedMotion(owner, (reducedMotion) => {
      if (reducedMotion) {
        gsap.set(el, { opacity: 1 });
        return undefined;
      }

      // Évite un flash avant le 1er tick GSAP de l'enter.
      if (handoff.hasPending()) {
        gsap.set(el, { opacity: 0 });
      }

      return undefined;
    });
  });
}
