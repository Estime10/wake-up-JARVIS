"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCallback, useRef, type RefObject } from "react";

import { useFinishOnce } from "@/features/intro/hooks/useFinishOnce";
import { useSkipHotkeys } from "@/features/intro/hooks/useSkipHotkeys";
import { createIntroTimeline } from "@/features/intro/model/createIntroTimeline";
import { queryIntroTimelineTargets } from "@/features/intro/model/queryIntroTimelineTargets";
import { shouldWaitForGreeting } from "@/features/intro/model/shouldWaitForGreeting";
import { skipIntroTimeline } from "@/features/intro/model/skipIntroTimeline";
import type { GsapTimeline } from "@/lib/gsap/timelineType";
import type { IntroMode } from "@/lib/intro/modes";

gsap.registerPlugin(useGSAP);

type UseIntroTimelineArgs = {
  mode: Exclude<IntroMode, "none">;
  reducedMotion: boolean;
  greetingReady: boolean;
  onComplete: () => void;
};

type UseIntroTimelineResult = {
  scopeRef: RefObject<HTMLDivElement | null>;
  skip: () => void;
};

/**
 * Compose : finish-once + hotkeys + timeline GSAP.
 * Une responsabilité par collaborateur — ce hook orchestre seulement.
 */
export function useIntroTimeline({
  mode,
  reducedMotion,
  greetingReady,
  onComplete,
}: UseIntroTimelineArgs): UseIntroTimelineResult {
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<GsapTimeline | null>(null);
  const { finish, reset } = useFinishOnce(onComplete);

  useGSAP(
    () => {
      const root = scopeRef.current;
      if (!root) {
        return;
      }

      const targets = queryIntroTimelineTargets(root);
      if (!targets) {
        return;
      }

      if (
        shouldWaitForGreeting({
          mode,
          reducedMotion,
          greetingReady,
          hasGreetingNode: targets.greeting !== null,
        })
      ) {
        return;
      }

      reset();

      const tl = createIntroTimeline(targets, {
        mode,
        reducedMotion,
        onComplete: finish,
      });

      timelineRef.current = tl;

      return () => {
        timelineRef.current = null;
      };
    },
    {
      scope: scopeRef,
      dependencies: [mode, reducedMotion, greetingReady, finish, reset],
      revertOnUpdate: true,
    },
  );

  const skip = useCallback(() => {
    skipIntroTimeline(timelineRef.current, finish);
  }, [finish]);

  useSkipHotkeys(skip);

  return { scopeRef, skip };
}
