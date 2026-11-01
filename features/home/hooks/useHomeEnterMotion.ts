"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type RefObject } from "react";

import { playHomeDirectEnter } from "@/features/home/model/playHomeDirectEnter";
import { playHomeEnterTransition } from "@/features/home/model/playHomeEnterTransition";
import { useJarvisShell } from "@/features/jarvis/context";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";

gsap.registerPlugin(useGSAP);

type UseHomeEnterMotionResult = {
  shellRef: RefObject<HTMLDivElement | null>;
  sideRef: RefObject<HTMLElement | null>;
};

/**
 * Entrée home : Flip splash→home si handoff, sinon entrée directe (refresh / URL).
 */
export function useHomeEnterMotion(): UseHomeEnterMotionResult {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLElement | null>(null);
  const { markRef, handoff } = useJarvisShell();

  useGSAP(
    (owner) => {
      const shell = shellRef.current;
      const aside = sideRef.current;
      if (!shell || !aside) {
        return undefined;
      }

      return matchReducedMotion(owner, (reducedMotion) => {
        const snapshot = handoff.peek();
        if (snapshot) {
          return playHomeEnterTransition({
            root: shell,
            mark: markRef.current,
            aside,
            snapshot,
            reducedMotion,
            // Fin d'enter hors contexte : listeners chrome / mark ne sont pas
            // revert à la prochaine bascule reduced-motion.
            onEnd: () => owner.ignore(() => handoff.end()),
          });
        }

        return playHomeDirectEnter({
          root: shell,
          mark: markRef.current,
          aside,
          reducedMotion,
          onEnd: () => {},
        });
      });
    },
    { scope: shellRef },
  );

  return { shellRef, sideRef };
}
