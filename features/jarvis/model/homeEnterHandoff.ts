import { isElement } from "@/features/jarvis/model/markDom";
import { Flip, type FlipState } from "@/lib/gsap/flip";
import { resetWelcomeSpeakSession } from "@/lib/voice/welcomeSpeak";

/** État Flip du splash (mark seul), rejoué par `Flip.from` sur /home. */
export type SplashEnterSnapshot = FlipState;

export type HomeEnterHandoff = {
  /** Avant `router.replace` — enregistre le snapshot splash. */
  begin: (snapshot: SplashEnterSnapshot) => void;
  /** Snapshot encore à jouer (survit à un cleanup Strict Mode). */
  hasPending: () => boolean;
  /** Lit le snapshot sans le consommer (replay possible si kill avant fin). */
  peek: () => SplashEnterSnapshot | null;
  /** Fin réelle de la timeline Flip — libère le pending et notifie. */
  end: () => void;
  /** Callback fin d’enter Flip (immédiat s'il n'y a rien en attente). */
  onComplete: (fn: () => void) => () => void;
  /**
   * Fin de l’animation d’entrée home (Flip ou entrée directe).
   * Immédiat si déjà terminée (subscribe tardif / Strict Mode).
   */
  onEnterComplete: (fn: () => void) => () => void;
  /** Signale la fin d’entrée (idempotent). Appelé aussi par `end()`. */
  notifyEnterComplete: () => void;
};

/**
 * `Flip.getState` du mark persistant seul (splash = mark + wake).
 * Wordmark hors Flip — révélé en briefing home.
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
  let enterSettled = false;
  let enterListeners: Array<() => void> = [];

  function notifyEnterComplete(): void {
    if (enterSettled) {
      return;
    }
    enterSettled = true;
    const notify = enterListeners;
    enterListeners = [];
    for (const listener of notify) {
      listener();
    }
  }

  return {
    begin(snapshot) {
      pending = snapshot;
      enterSettled = false;
      resetWelcomeSpeakSession();
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
      notifyEnterComplete();
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
    onEnterComplete(fn) {
      if (enterSettled) {
        fn();
        return () => {};
      }
      enterListeners.push(fn);
      return () => {
        enterListeners = enterListeners.filter((listener) => listener !== fn);
      };
    },
    notifyEnterComplete,
  };
}
