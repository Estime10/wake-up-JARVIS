"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type RefObject } from "react";

import { startDialIdleSpin } from "@/features/intro/model/startDialIdleSpin";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

gsap.registerPlugin(useGSAP);

type UseDialIdleSpinResult = {
  scopeRef: RefObject<HTMLDivElement | null>;
};

/** Spin antihoraire du cadran pointillé — seule motion du home. */
export function useDialIdleSpin(): UseDialIdleSpinResult {
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const root = scopeRef.current;
      if (!root || reducedMotion) {
        return;
      }

      const ringDial = root.querySelector<SVGGeometryElement>(
        "[data-jarvis='ring-dial']",
      );
      if (!ringDial) {
        return;
      }

      startDialIdleSpin(ringDial);
    },
    { scope: scopeRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return { scopeRef };
}
