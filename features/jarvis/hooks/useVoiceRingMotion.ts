"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import type { AssistantState } from "@/features/home/model/assistantMachine";
import { useJarvisShell } from "@/features/jarvis/context";
import { applyVoiceRingState } from "@/features/jarvis/model/voiceRing/applyVoiceRingState";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";

gsap.registerPlugin(useGSAP);

/**
 * Pilote les modes SVG du mark fixed selon l’état assistant.
 * Un seul cleanup : la fonction rendue au contexte GSAP (appelée à chaque
 * changement d'état, de préférence de mouvement et au démontage). Les tweens
 * d'état sont créés hors enregistrement (`context.ignore`) : un revert
 * remettrait opacités, échelles et rotations à zéro et casserait le fondu
 * enchaîné entre deux états ; le cleanup les tue donc sans revert.
 */
export function useVoiceRingMotion(state: AssistantState): void {
  const { markRef } = useJarvisShell();

  useGSAP(
    (owner) => {
      const mark = markRef.current;
      if (!mark) {
        return undefined;
      }
      return matchReducedMotion(owner, (reducedMotion, context) => {
        let stop = (): void => {};
        context.ignore(() => {
          stop = applyVoiceRingState(mark, state, { reducedMotion });
        });
        return stop;
      });
    },
    { dependencies: [state], revertOnUpdate: true },
  );
}
