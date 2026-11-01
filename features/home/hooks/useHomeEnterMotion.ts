"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type RefObject } from "react";

import { peekHomeEnterSnapshot } from "@/features/jarvis/model/homeEnterHandoff";
import { openSidePanel } from "@/features/home/model/openSidePanel";
import { playHomeEnterTransition } from "@/features/home/model/playHomeEnterTransition";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

gsap.registerPlugin(useGSAP);

type UseHomeEnterMotionResult = {
  shellRef: RefObject<HTMLDivElement | null>;
  sideRef: RefObject<HTMLElement | null>;
};

/**
 * Entrée home : timeline splash→home (scale mark inclus) ou ouverture panneau seule.
 */
export function useHomeEnterMotion(): UseHomeEnterMotionResult {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const shell = shellRef.current;
      const aside = sideRef.current;
      if (!shell || !aside) {
        return undefined;
      }

      const snapshot = peekHomeEnterSnapshot();
      if (snapshot) {
        return playHomeEnterTransition({
          shell,
          aside,
          snapshot,
          reducedMotion,
        });
      }

      openSidePanel({ shell, aside, reducedMotion });
      return undefined;
    },
    { scope: shellRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return { shellRef, sideRef };
}
