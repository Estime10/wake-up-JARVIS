"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { RefObject } from "react";

import { useJarvisShell } from "@/features/jarvis/context";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";

gsap.registerPlugin(useGSAP);

/**
 * Équerres + méta HUD — opacity GSAP uniquement.
 * Handoff pending : caché jusqu’au briefing hold / settle.
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

      if (handoff.hasPending()) {
        gsap.set(el, { opacity: 0 });
      } else {
        gsap.set(el, { opacity: 1 });
      }

      return handoff.onEnterComplete(() => {
        gsap.set(el, { opacity: 1 });
      });
    });
  });
}
