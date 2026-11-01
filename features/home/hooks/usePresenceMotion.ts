"use client";

import { useEffect, useState } from "react";

import { REPO_MOTION_MS } from "@/features/home/animations";
import { prefersReducedMotion } from "@/lib/motion/reducedMotion";

export { REPO_MOTION_MS };

type PresenceMotion = {
  /** Garder le DOM pendant l’outro. */
  mounted: boolean;
  /** Classe « ouvert » (opacity / translate). */
  visible: boolean;
};

/**
 * Monte → anime l’entrée ; à la fermeture anime la sortie puis démonte.
 *
 * Close : bascule `visible` après paint (double rAF), puis démonte après
 * `durationMs` — sinon fermeture sèche (pas de frame « ouvert » à interpoler).
 */
export function usePresenceMotion(
  active: boolean,
  durationMs: number = REPO_MOTION_MS,
): PresenceMotion {
  const [rendered, setRendered] = useState(active);
  const [visible, setVisible] = useState(false);
  const [wasActive, setWasActive] = useState(active);

  if (active !== wasActive) {
    setWasActive(active);
    if (active) {
      setRendered(true);
      setVisible(false);
    }
  }

  const mounted = active || rendered;

  useEffect(() => {
    if (active) {
      if (prefersReducedMotion()) {
        const id = window.setTimeout(() => setVisible(true), 0);
        return () => window.clearTimeout(id);
      }
      let innerId = 0;
      const outerId = window.requestAnimationFrame(() => {
        innerId = window.requestAnimationFrame(() => {
          setVisible(true);
        });
      });
      return () => {
        window.cancelAnimationFrame(outerId);
        window.cancelAnimationFrame(innerId);
      };
    }

    if (prefersReducedMotion()) {
      const id = window.setTimeout(() => {
        setVisible(false);
        setRendered(false);
      }, 0);
      return () => window.clearTimeout(id);
    }

    let innerId = 0;
    let unmountId = 0;
    const outerId = window.requestAnimationFrame(() => {
      innerId = window.requestAnimationFrame(() => {
        setVisible(false);
        unmountId = window.setTimeout(() => {
          setRendered(false);
        }, durationMs);
      });
    });

    return () => {
      window.cancelAnimationFrame(outerId);
      window.cancelAnimationFrame(innerId);
      window.clearTimeout(unmountId);
    };
  }, [active, durationMs]);

  return { mounted, visible };
}
