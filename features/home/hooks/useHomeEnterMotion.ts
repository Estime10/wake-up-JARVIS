"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

import { playHomeBriefingHold } from "@/features/home/model/playHomeBriefingHold";
import { playHomeSettleTransition } from "@/features/home/model/playHomeSettleTransition";
import {
  peekMarkClusterFromPose,
  stashMarkClusterFromPose,
} from "@/features/home/model/markClusterFromPose";
import type { HomeEnterPhase } from "@/features/home/model/homeEnterPhase";
import { HOME_SIDE_ENTER_X } from "@/features/home/model/homeEnterTweens";
import { useJarvisShell } from "@/features/jarvis/context/jarvisShellContext";
import {
  querySideLeft,
  querySideRight,
  queryTopbar,
} from "@/features/jarvis/model/markDom";
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
 * Entrée home après boot overlay : hold briefing puis settle clusteré
 * (mark + header + sides + musique, même timeline).
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

  const beginSettle = useCallback(() => {
    if (settleStartedRef.current) {
      return;
    }
    settleStartedRef.current = true;

    const shell = shellRef.current;
    const mark = markRef.current;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    stashMarkClusterFromPose({
      mark: mark ? mark.getBoundingClientRect() : null,
    });
    setPhase("settling");

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!shell) {
          if (handoff.hasPending()) {
            handoff.end();
          } else {
            handoff.notifyEnterComplete();
          }
          setPhase("ready");
          return;
        }
        playHomeSettleTransition({
          root: shell,
          mark,
          aside: sideRef.current,
          reducedMotion,
          fromPose: peekMarkClusterFromPose(),
          onEnd: () => {
            if (handoff.hasPending()) {
              handoff.end();
            } else {
              handoff.notifyEnterComplete();
            }
            setPhase("ready");
          },
        });
      });
    });
  }, [handoff, markRef]);

  /** Avant paint settling : UI hors écran — tout arrive ensemble dans la timeline. */
  useLayoutEffect(() => {
    if (phase !== "settling") {
      return;
    }
    const shell = shellRef.current;
    if (!shell) {
      return;
    }
    const topbar = queryTopbar(shell);
    if (topbar) {
      gsap.set(topbar, { opacity: 0, y: -28 });
    }
    const sideLeft = querySideLeft(shell);
    if (sideLeft) {
      gsap.set(sideLeft, { opacity: 0, x: -HOME_SIDE_ENTER_X });
    }
    const sideRight = querySideRight(shell);
    if (sideRight) {
      gsap.set(sideRight, { opacity: 0, x: HOME_SIDE_ENTER_X });
    }
  }, [phase]);

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
