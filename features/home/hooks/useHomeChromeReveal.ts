"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { RefObject } from "react";

import {
  hasPendingHomeEnter,
  onHomeEnterComplete,
} from "@/features/jarvis/model/homeEnterHandoff";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

gsap.registerPlugin(useGSAP);

const FADE_DURATION = 0.75;

/**
 * Équerres + méta HUD : invisibles pendant l’enter, fade-in à la fin
 * (ou au mount si refresh / entrée directe).
 */
export function useHomeChromeReveal(
  chromeRef: RefObject<HTMLElement | null>,
): void {
  const reducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const el = chromeRef.current;
      if (!el) {
        return undefined;
      }

      if (reducedMotion) {
        gsap.set(el, { opacity: 1 });
        return undefined;
      }

      gsap.set(el, { opacity: 0 });

      const fadeIn = () => {
        gsap.to(el, {
          opacity: 1,
          duration: FADE_DURATION,
          ease: "power2.out",
        });
      };

      if (hasPendingHomeEnter()) {
        return onHomeEnterComplete(fadeIn);
      }

      fadeIn();
      return undefined;
    },
    { dependencies: [reducedMotion], revertOnUpdate: true },
  );
}
