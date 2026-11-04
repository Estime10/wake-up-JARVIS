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
import { consumeSplashV1Done } from "@/lib/intro/splashV1Session";
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
 * Entrée home :
 * 1) briefing — mark + révélation JARVIS → briefingReady (TTS)
 * 2) settle — Flip mark+JARVIS vers home, puis input
 * Après splash SVG v1 : pas de 2e briefing mark géant.
 */
export function useHomeEnterMotion(): UseHomeEnterMotionResult {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLElement | null>(null);
  const { markRef, handoff } = useJarvisShell();
  const [phase, setPhase] = useState<HomeEnterPhase>("briefing");
  const [briefingReady, setBriefingReady] = useState(false);
  const [skipCenteredBriefing] = useState(() => consumeSplashV1Done());
  const settleStartedRef = useRef(false);
  const flipSnapshotRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  useGSAP(
    (owner) => {
      const shell = shellRef.current;
      const aside = sideRef.current;
      if (!shell || !aside) {
        return undefined;
      }

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
              skipCenteredBriefing,
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
    { scope: shellRef, dependencies: [skipCenteredBriefing] },
  );

  const runSettle = useCallback(() => {
    const shell = shellRef.current;
    const aside = sideRef.current;
    if (!shell || !aside) {
      setPhase("ready");
      return;
    }

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

    // Splash v1 : mark déjà au slot home — settle chrome/composer seulement.
    if (skipCenteredBriefing) {
      const shell = shellRef.current;
      const aside = sideRef.current;
      if (shell && aside) {
        playHomeSettleTransition({
          root: shell,
          mark: markRef.current,
          aside,
          reducedMotion: true,
          flipSnapshot: null,
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

    // Snapshot AVANT le re-layout settling (mark grand + JARVIS display).
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
    if (phase !== "briefing") {
      return undefined;
    }
    // Filet si greeting / settle ne partent jamais.
    const id = window.setTimeout(() => {
      beginSettle();
    }, 50_000);
    return () => {
      window.clearTimeout(id);
    };
  }, [phase, beginSettle]);

  return {
    shellRef,
    sideRef,
    phase,
    briefingReady,
    beginSettle,
    skipCenteredBriefing,
  };
}
