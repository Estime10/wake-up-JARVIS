"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { RefObject } from "react";

import { useJarvisShell } from "@/features/jarvis/jarvisShellContext";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";

gsap.registerPlugin(useGSAP);

const FADE_DURATION = 0.75;

/**
 * Équerres + méta HUD : invisibles pendant l’enter, fade-in à la fin
 * (ou au mount si refresh / entrée directe).
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

      // Appelé plus tard (fin de l'enter, hors contexte : `owner.ignore` de
      // useHomeEnterMotion) : `context.add` rattache le tween à CE contexte
      // seul, sans l'imbriquer dans celui de l'entrée.
      const fadeIn = () => {
        context.add(() => {
          gsap.to(el, {
            opacity: 1,
            duration: FADE_DURATION,
            ease: "power2.out",
          });
        });
      };

      if (handoff.hasPending()) {
        return handoff.onComplete(fadeIn);
      }

      fadeIn();
      return undefined;
    });
  });
}
