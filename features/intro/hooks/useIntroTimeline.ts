"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useRef, type RefObject } from "react";

import { useFinishOnce } from "@/features/intro/hooks/useFinishOnce";
import { useSkipHotkeys } from "@/features/intro/hooks/useSkipHotkeys";
import { createIntroTimeline } from "@/features/intro/model/createIntroTimeline";
import { queryIntroTimelineTargets } from "@/features/intro/model/queryIntroTimelineTargets";
import { skipIntroTimeline } from "@/features/intro/model/skipIntroTimeline";
import { useJarvisShell } from "@/features/jarvis/context";
import type { GsapTimeline } from "@/lib/gsap/timelineType";
import type { IntroMode } from "@/lib/intro/modes";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";

gsap.registerPlugin(useGSAP);

type UseIntroTimelineArgs = {
  mode: Exclude<IntroMode, "none">;
  onComplete: () => void;
};

type UseIntroTimelineResult = {
  scopeRef: RefObject<HTMLDivElement | null>;
  skip: () => void;
};

/**
 * Compose : finish-once + hotkeys + timeline GSAP.
 * Splash = mark + wake uniquement (pas d'attente greeting).
 */
export function useIntroTimeline({
  mode,
  onComplete,
}: UseIntroTimelineArgs): UseIntroTimelineResult {
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<GsapTimeline | null>(null);
  const { finish, reset } = useFinishOnce(onComplete);
  const { markRef } = useJarvisShell();

  useGSAP(
    (owner) => {
      const root = scopeRef.current;
      if (!root) {
        return undefined;
      }

      const targets = queryIntroTimelineTargets(root, markRef.current);
      if (!targets) {
        return undefined;
      }

      return matchReducedMotion(owner, (reducedMotion) => {
        reset();

        timelineRef.current = createIntroTimeline(targets, {
          mode,
          reducedMotion,
          onComplete: finish,
        });

        return () => {
          timelineRef.current = null;
        };
      });
    },
    {
      scope: scopeRef,
      dependencies: [mode, finish, reset],
      revertOnUpdate: true,
    },
  );

  const skip = useCallback(() => {
    skipIntroTimeline(timelineRef.current, finish);
  }, [finish]);

  useSkipHotkeys(skip);

  return { scopeRef, skip };
}
