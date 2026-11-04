"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useRef, useState, type RefObject } from "react";

import { useFinishOnce } from "@/features/intro/hooks/useFinishOnce";
import {
  buildSplashV1ReducedTimeline,
  buildSplashV1Timeline,
} from "@/features/intro/model/buildSplashV1Timeline";
import { INTRO_DURATION_FULL_MS } from "@/lib/intro/timings";
import { prefersReducedMotion } from "@/lib/motion/reducedMotion";

gsap.registerPlugin(useGSAP);

/**
 * Une seule timeline « live » à la fois.
 * Strict Mode : cleanup kill → remount peut rejouer une fois (DOM neuf).
 * On évite les chevauchements via `activeTl`.
 */
let activeTl: gsap.core.Timeline | null = null;

type UseSplashV1TimelineArgs = {
  onComplete: () => void;
};

type UseSplashV1TimelineResult = {
  hostRef: RefObject<HTMLDivElement | null>;
  onSvgReady: () => void;
};

/**
 * Timeline splash v1 — prime le SVG puis joue (scène invisible avant).
 */
export function useSplashV1Timeline({
  onComplete,
}: UseSplashV1TimelineArgs): UseSplashV1TimelineResult {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [svgReady, setSvgReady] = useState(false);
  const { finish } = useFinishOnce(onComplete);

  const onSvgReady = useCallback(() => {
    setSvgReady(true);
  }, []);

  useGSAP(
    () => {
      const root = hostRef.current;
      if (!root || !svgReady) {
        return undefined;
      }
      if (!root.querySelector("[data-splash-scene] svg")) {
        return undefined;
      }

      // Tue une timeline orpheline (Strict Mode) avant d’en créer une nouvelle.
      if (activeTl) {
        activeTl.kill();
        activeTl = null;
      }

      const reduced = prefersReducedMotion();
      let safetyId = 0;
      let minId = 0;
      let timelineDone = false;
      let minElapsed = reduced;

      const tryFinish = () => {
        if (timelineDone && minElapsed) {
          finish();
        }
      };

      const onTimelineDone = () => {
        timelineDone = true;
        tryFinish();
      };

      const tl = reduced
        ? buildSplashV1ReducedTimeline(root, onTimelineDone)
        : buildSplashV1Timeline(root, onTimelineDone);
      activeTl = tl;

      if (!reduced) {
        minId = window.setTimeout(() => {
          minElapsed = true;
          tryFinish();
        }, INTRO_DURATION_FULL_MS);
        safetyId = window.setTimeout(
          onTimelineDone,
          INTRO_DURATION_FULL_MS + 500,
        );
        tl.eventCallback("onComplete", () => {
          window.clearTimeout(safetyId);
          onTimelineDone();
        });
      }

      return () => {
        window.clearTimeout(minId);
        window.clearTimeout(safetyId);
        if (activeTl === tl) {
          activeTl = null;
        }
        tl.kill();
      };
    },
    {
      scope: hostRef,
      dependencies: [svgReady, finish],
      revertOnUpdate: false,
    },
  );

  return { hostRef, onSvgReady };
}
