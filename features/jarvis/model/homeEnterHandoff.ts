import { isElement } from "@/features/jarvis/model/markDom";
import { Flip, type FlipState } from "@/lib/gsap/flip";

/** État Flip du splash (mark seul), rejoué par `Flip.from` sur /home. */
export type SplashEnterSnapshot = FlipState;

export type HomeEnterHandoff = {
  /** Avant `router.replace` — enregistre le snapshot splash. */
  begin: (snapshot: SplashEnterSnapshot) => void;
  /** Snapshot encore à jouer (survit à un cleanup Strict Mode). */
  hasPending: () => boolean;
  /** Lit le snapshot sans le consommer (replay possible si kill avant fin). */
  peek: () => SplashEnterSnapshot | null;
  /** Fin réelle de la timeline — libère le pending et notifie. */
  end: () => void;
  /** Callback fin d’enter (immédiat s'il n'y a rien en attente). */
  onComplete: (fn: () => void) => () => void;
};

/**
 * `Flip.getState` du mark persistant seul (splash = mark + wake).
 * Wordmark / greeting ne font plus partie du Flip.
 */
export function captureSplashSnapshot(
  mark: HTMLElement | null,
  _splashRoot: ParentNode,
): SplashEnterSnapshot {
  void _splashRoot;
  return Flip.getState([mark].filter(isElement));
}

/**
 * Une instance par coquille app (créée par JarvisShell, partagée par
 * contexte React) — aucun état au niveau module.
 */
export function createHomeEnterHandoff(): HomeEnterHandoff {
  let pending: SplashEnterSnapshot | null = null;
  let listeners: Array<() => void> = [];

  return {
    begin(snapshot) {
      pending = snapshot;
    },
    hasPending() {
      return pending !== null;
    },
    peek() {
      return pending;
    },
    end() {
      pending = null;
      const notify = listeners;
      listeners = [];
      for (const listener of notify) {
        listener();
      }
    },
    onComplete(fn) {
      if (!pending) {
        fn();
        return () => {};
      }
      listeners.push(fn);
      return () => {
        listeners = listeners.filter((listener) => listener !== fn);
      };
    },
  };
}
