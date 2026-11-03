"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef, type RefObject } from "react";

import { playHomeDirectEnter } from "@/features/home/model/playHomeDirectEnter";
import { playHomeEnterTransition } from "@/features/home/model/playHomeEnterTransition";
import {
  HOME_CHROME_DURATION,
  MARK_ENTER_DURATION,
} from "@/features/home/model/homeEnterTweens";
import { useJarvisShell } from "@/features/jarvis/context";
import {
  matchReducedMotion,
  prefersReducedMotion,
} from "@/lib/motion/reducedMotion";
import {
  resetHomeWelcomeSchedule,
  scheduleHomeWelcomeSpeak,
} from "@/lib/voice/scheduleHomeWelcomeSpeak";
import { unlockSpeechFromUserGesture } from "@/lib/voice/speechUnlock";
import { wasWelcomeSpeakPlayed } from "@/lib/voice/welcomeSpeak";

gsap.registerPlugin(useGSAP);

type UseHomeEnterMotionResult = {
  shellRef: RefObject<HTMLDivElement | null>;
  sideRef: RefObject<HTMLElement | null>;
};

function finishHomeEnter(signalEnterComplete: () => void): void {
  scheduleHomeWelcomeSpeak();
  signalEnterComplete();
}

/**
 * Entrée home + salut TTS après anim.
 * Le splash a déjà débloqué speechSynthesis via le geste de réveil.
 */
export function useHomeEnterMotion(): UseHomeEnterMotionResult {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLElement | null>(null);
  const { markRef, handoff } = useJarvisShell();
  const didResetRef = useRef(false);

  useGSAP(
    (owner) => {
      const shell = shellRef.current;
      const aside = sideRef.current;
      if (!shell || !aside) {
        return undefined;
      }

      return matchReducedMotion(owner, (reducedMotion) => {
        const snapshot = handoff.peek();
        if (snapshot) {
          return playHomeEnterTransition({
            root: shell,
            mark: markRef.current,
            aside,
            snapshot,
            reducedMotion,
            onEnd: () =>
              owner.ignore(() => finishHomeEnter(() => handoff.end())),
          });
        }

        return playHomeDirectEnter({
          root: shell,
          mark: markRef.current,
          aside,
          reducedMotion,
          onEnd: () =>
            owner.ignore(() =>
              finishHomeEnter(() => handoff.notifyEnterComplete()),
            ),
        });
      });
    },
    { scope: shellRef },
  );

  useEffect(() => {
    // Une seule reset par montage home (évite cancel Strict Mode en boucle).
    if (!didResetRef.current) {
      didResetRef.current = true;
      // handoff.begin a déjà reset si splash→home ; sinon entrée directe.
      if (!handoff.hasPending()) {
        resetHomeWelcomeSchedule();
      }
    }

    const baseMs = prefersReducedMotion()
      ? 200
      : Math.ceil((MARK_ENTER_DURATION + HOME_CHROME_DURATION + 0.35) * 1000);

    const timers = [0, 800, 2000].map((extra) =>
      window.setTimeout(() => {
        scheduleHomeWelcomeSpeak();
        handoff.notifyEnterComplete();
      }, baseMs + extra),
    );

    // Filet ultime : premier geste sur home si Chrome a encore bloqué.
    const onGesture = () => {
      if (wasWelcomeSpeakPlayed()) {
        return;
      }
      unlockSpeechFromUserGesture();
      scheduleHomeWelcomeSpeak();
    };
    window.addEventListener("pointerdown", onGesture, { capture: true });
    window.addEventListener("keydown", onGesture, { capture: true });

    return () => {
      for (const id of timers) {
        window.clearTimeout(id);
      }
      window.removeEventListener("pointerdown", onGesture, { capture: true });
      window.removeEventListener("keydown", onGesture, { capture: true });
    };
  }, [handoff]);

  return { shellRef, sideRef };
}
