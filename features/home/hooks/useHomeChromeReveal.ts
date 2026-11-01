"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { RefObject } from "react";

import { useJarvisShell } from "@/features/jarvis/context";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";

gsap.registerPlugin(useGSAP);

const FADE_DURATION = 0.75;

/**
 * Équerres + méta HUD : invisibles pendant l’enter.
 * Handoff Flip → fade à `handoff.end` ; entrée directe → `playHomeDirectEnter`.
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

    return matchReducedMotion(owner, (reducedMotion, context) => {
      if (reducedMotion) {
        gsap.set(el, { opacity: 1 });
        return undefined;
      }

      gsap.set(el, { opacity: 0 });

      // Sans handoff : l’entrée directe anime le chrome (`data-home="chrome"`).
      if (!handoff.hasPending()) {
        return undefined;
      }

      const fadeIn = () => {
        context.add(() => {
          gsap.to(el, {
            opacity: 1,
            duration: FADE_DURATION,
            ease: "power2.out",
          });
        });
      };

      return handoff.onComplete(fadeIn);
    });
  });
}
