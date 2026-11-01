"use client";

import { useCallback, useRef } from "react";

import { useLatestRef } from "@/lib/hooks/useLatestRef";

/**
 * Callback exécuté au plus une fois, jusqu'à `reset()`.
 * Sépare la sémantique « complete » de la timeline GSAP.
 */
export function useFinishOnce(onComplete: () => void): {
  finish: () => void;
  reset: () => void;
} {
  const doneRef = useRef(false);
  const onCompleteRef = useLatestRef(onComplete);

  const finish = useCallback(() => {
    if (doneRef.current) {
      return;
    }
    doneRef.current = true;
    onCompleteRef.current();
  }, [onCompleteRef]);

  const reset = useCallback(() => {
    doneRef.current = false;
  }, []);

  return { finish, reset };
}
