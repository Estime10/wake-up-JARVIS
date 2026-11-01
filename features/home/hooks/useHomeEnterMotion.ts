"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type RefObject } from "react";

import { playHomeEnterTransition } from "@/features/home/model/playHomeEnterTransition";
import { setSidePanelOpen } from "@/features/home/model/sidePanelLayout";
import { useJarvisShell } from "@/features/jarvis/jarvisShellContext";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";

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
            // Fin d'enter appelée depuis le onComplete de la timeline : sans
            // `ignore`, les listeners (placement du mark, fondu du chrome)
            // s'enregistreraient dans CE contexte et seraient revert à la
            // prochaine bascule reduced-motion.
            onEnd: () => owner.ignore(() => handoff.end()),
          });
        }
        // Refresh / entrée directe : panneau posé ouvert, sans anim.
        setSidePanelOpen(aside);
        return undefined;
      });
    },
    { scope: shellRef },
  );

  return { shellRef, sideRef };
}
