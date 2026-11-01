"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";

import type { AssistantState } from "@/features/home/model/assistantMachine";
import { applyVoiceRingState } from "@/features/jarvis/model/applyVoiceRingState";
import { queryMark } from "@/features/jarvis/model/markDom";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

gsap.registerPlugin(useGSAP);

/**
 * Pilote les modes SVG du mark fixed selon l’état assistant.
 */
export function useVoiceRingMotion(state: AssistantState, muted = false): void {
  const reducedMotion = usePrefersReducedMotion();
  const cleanupRef = useRef<(() => void) | null>(null);

  useGSAP(
    () => {
      const mark = queryMark();
      if (!mark) {
        return;
      }
      cleanupRef.current?.();
      cleanupRef.current = applyVoiceRingState(mark, state, {
        reducedMotion,
        muted,
      });
    },
    { dependencies: [state, muted, reducedMotion], revertOnUpdate: false },
  );

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, []);
}
