"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";

import { playHomeBootTimeline } from "@/features/intro/model/playHomeBootTimeline";

gsap.registerPlugin(useGSAP);

type HomeBootOverlayProps = {
  onFinished: () => void;
};

/**
 * Boot home : scan seulement.
 * Le nom E.L.S.A. vit dans AssistantStage (sous le mark) — animé ici,
 * puis laissé en place (pas de doublon overlay qui disparaît).
 */
export function HomeBootOverlay({ onFinished }: HomeBootOverlayProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const finishedRef = useRef(false);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || finishedRef.current) {
        return undefined;
      }
      return playHomeBootTimeline({
        root,
        onComplete: () => {
          if (finishedRef.current) {
            return;
          }
          finishedRef.current = true;
          onFinished();
        },
      });
    },
    { scope: rootRef, dependencies: [onFinished] },
  );

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-[60] text-accent"
      aria-hidden
    >
      <div
        data-boot-scan
        className="absolute inset-x-0 top-0 h-[12vh] min-h-16 will-change-transform"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, currentColor 6%, transparent) 70%, transparent 100%)",
          boxShadow:
            "0 1px 0 color-mix(in oklab, currentColor 32%, transparent)",
        }}
      />
    </div>
  );
}
