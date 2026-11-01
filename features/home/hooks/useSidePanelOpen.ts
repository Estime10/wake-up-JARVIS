"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type RefObject } from "react";

import { openSidePanel } from "@/features/home/model/openSidePanel";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

gsap.registerPlugin(useGSAP);

type UseSidePanelOpenResult = {
  shellRef: RefObject<HTMLDivElement | null>;
  sideRef: RefObject<HTMLElement | null>;
};

/** Orchestre l'ouverture slide du panneau — pas de rendu UI. */
export function useSidePanelOpen(): UseSidePanelOpenResult {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const shell = shellRef.current;
      const aside = sideRef.current;
      if (!shell || !aside) {
        return;
      }
      openSidePanel({ shell, aside, reducedMotion });
    },
    { scope: shellRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return { shellRef, sideRef };
}
