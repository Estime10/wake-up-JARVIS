"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { playHomeBriefingHold } from "@/features/home/model/playHomeBriefingHold";
import { playHomeSettleTransition } from "@/features/home/model/playHomeSettleTransition";
import type { HomeEnterPhase } from "@/features/home/model/homeEnterPhase";
import { useJarvisShell } from "@/features/jarvis/context";
import { queryWordmark } from "@/features/jarvis/model/markDom";
import { Flip } from "@/lib/gsap/flip";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";

gsap.registerPlugin(useGSAP);

type UseHomeEnterMotionResult = {
  shellRef: RefObject<HTMLDivElement | null>;
  sideRef: RefObject<HTMLElement | null>;
  phase: HomeEnterPhase;
  briefingReady: boolean;
  beginSettle: () => void;
  skipCenteredBriefing: boolean;
};

/**
 * Entrée home après splash overlay (même page) :
 * mark déjà posé → fade input seulement (`preserveMarkPose`).
 * Tant que `splashDone` est false, aucune timeline home.
 */
export function useHomeEnterMotion(
  splashDone: boolean,
): UseHomeEnterMotionResult {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLElement | null>(null);
  const { markRef, handoff } = useJarvisShell();
  const [phase, setPhase] = useState<HomeEnterPhase>("briefing");
  const [briefingReady, setBriefingReady] = useState(false);
  /** Boot = overlay scan+nom sur home — jamais de briefing mark géant legacy. */
  const skipCenteredBriefing = true;
  const settleStartedRef = useRef(false);
  const flipSnapshotRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  useGSAP(
    (owner) => {
      if (!splashDone) {
        return undefined;
      }

      const shell = shellRef.current;
      if (!shell) {
        return undefined;
      }
      const aside = sideRef.current;

      return matchReducedMotion(owner, (reducedMotion) => {
        const snapshot = handoff.peek();
        let cleanupHold: (() => void) | undefined;
        let rafOuter = 0;
        let rafInner = 0;

        rafOuter = window.requestAnimationFrame(() => {
          rafInner = window.requestAnimationFrame(() => {
            cleanupHold = playHomeBriefingHold({
              root: shell,
              mark: markRef.current,
              aside,
              reducedMotion,
              fromSplash: snapshot !== null,
              flipSnapshot: snapshot,
              skipCenteredBriefing: true,
              onReady: () => {
                owner.ignore(() => {
                  setBriefingReady(true);
                  setPhase("briefing");
                });
              },
            });
          });
        });

        return () => {
          window.cancelAnimationFrame(rafOuter);
          window.cancelAnimationFrame(rafInner);
          cleanupHold?.();
        };
      });
    },
    { scope: shellRef, dependencies: [splashDone] },
  );

  const runSettle = useCallback(() => {
    const shell = shellRef.current;
    if (!shell) {
      setPhase("ready");
      return;
    }
    const aside = sideRef.current;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    playHomeSettleTransition({
      root: shell,
      mark: markRef.current,
      aside,
      reducedMotion,
      flipSnapshot: flipSnapshotRef.current,
      onEnd: () => {
        flipSnapshotRef.current = null;
        if (handoff.hasPending()) {
          handoff.end();
        } else {
          handoff.notifyEnterComplete();
        }
        setPhase("ready");
      },
    });
  }, [handoff, markRef]);

  const beginSettle = useCallback(() => {
    if (settleStartedRef.current) {
      return;
    }
    settleStartedRef.current = true;

    // Post-splash home : pose mark figée — fade composer seulement.
    if (skipCenteredBriefing) {
      const shell = shellRef.current;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      setPhase("settling");
      if (shell) {
        playHomeSettleTransition({
          root: shell,
          mark: markRef.current,
          aside: sideRef.current,
          reducedMotion,
          flipSnapshot: null,
          preserveMarkPose: true,
          onEnd: () => {
            if (handoff.hasPending()) {
              handoff.end();
            } else {
              handoff.notifyEnterComplete();
            }
            setPhase("ready");
          },
        });
      } else {
        if (handoff.hasPending()) {
          handoff.end();
        } else {
          handoff.notifyEnterComplete();
        }
        setPhase("ready");
      }
      return;
    }

    const shell = shellRef.current;
    const mark = markRef.current;
    const wordmark = shell ? queryWordmark(shell) : null;
    const flipTargets: HTMLElement[] = [];
    if (mark) {
      flipTargets.push(mark);
    }
    if (wordmark) {
      flipTargets.push(wordmark);
    }
    flipSnapshotRef.current =
      flipTargets.length > 0 ? Flip.getState(flipTargets) : null;

    setPhase("settling");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        runSettle();
      });
    });
  }, [handoff, markRef, runSettle, skipCenteredBriefing]);

  useEffect(() => {
    if (!splashDone || phase !== "briefing") {
      return undefined;
    }
    const id = window.setTimeout(() => {
      beginSettle();
    }, 50_000);
    return () => {
      window.clearTimeout(id);
    };
  }, [splashDone, phase, beginSettle]);

  return {
    shellRef,
    sideRef,
    phase,
    briefingReady,
    beginSettle,
    skipCenteredBriefing,
  };
}
