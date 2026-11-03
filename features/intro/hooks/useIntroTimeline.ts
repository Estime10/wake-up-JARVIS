"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  type RefObject,
} from "react";

import { useFinishOnce } from "@/features/intro/hooks/useFinishOnce";
import { createIntroTimeline } from "@/features/intro/model/createIntroTimeline";
import { queryIntroTimelineTargets } from "@/features/intro/model/queryIntroTimelineTargets";
import { useJarvisShell } from "@/features/jarvis/context";
import type { IntroMode } from "@/lib/intro/modes";
import { matchReducedMotion } from "@/lib/motion/reducedMotion";
import { prefetchSpeechVoices } from "@/lib/voice/prefetchVoices";
import {
  isSpeechUnlocked,
  unlockSpeechFromUserGesture,
} from "@/lib/voice/speechUnlock";

gsap.registerPlugin(useGSAP);

type UseIntroTimelineArgs = {
  mode: Exclude<IntroMode, "none">;
  onComplete: () => void;
};

type UseIntroTimelineResult = {
  scopeRef: RefObject<HTMLDivElement | null>;
  /** Anim terminée — en attente du geste de réveil (débloque le TTS). */
  awaitingWake: boolean;
};

/**
 * Intro GSAP sans skip : l’anim va toujours jusqu’au bout.
 * Ensuite seulement : geste de réveil → home (TTS Chrome).
 */
export function useIntroTimeline({
  mode,
  onComplete,
}: UseIntroTimelineArgs): UseIntroTimelineResult {
  const scopeRef = useRef<HTMLDivElement | null>(null);
  const { finish, reset } = useFinishOnce(onComplete);
  const { markRef } = useJarvisShell();
  const [awaitingWake, setAwaitingWake] = useState(false);

  const confirmWake = useCallback(() => {
    unlockSpeechFromUserGesture();
    setAwaitingWake(false);
    finish();
  }, [finish]);

  const onTimelineComplete = useCallback(() => {
    if (isSpeechUnlocked()) {
      finish();
      return;
    }
    setAwaitingWake(true);
  }, [finish]);

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

      prefetchSpeechVoices();

      return matchReducedMotion(owner, (reducedMotion) => {
        reset();
        queueMicrotask(() => {
          setAwaitingWake(false);
        });

        createIntroTimeline(targets, {
          mode,
          reducedMotion,
          onComplete: onTimelineComplete,
        });

        return undefined;
      });
    },
    {
      scope: scopeRef,
      dependencies: [mode, onTimelineComplete, reset],
      revertOnUpdate: true,
    },
  );

  // Geste autorisé UNIQUEMENT après la fin de l’anim (pas de skip).
  useEffect(() => {
    if (!awaitingWake) {
      return undefined;
    }
    const onGesture = () => {
      confirmWake();
    };
    window.addEventListener("pointerdown", onGesture, { capture: true });
    window.addEventListener("keydown", onGesture, { capture: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture, { capture: true });
      window.removeEventListener("keydown", onGesture, { capture: true });
    };
  }, [awaitingWake, confirmWake]);

  return { scopeRef, awaitingWake };
}
