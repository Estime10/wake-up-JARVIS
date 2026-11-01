import {
  MARK_DOM,
  readBounds,
  type EnterBounds,
} from "@/features/jarvis/model/markDom";

export type { EnterBounds };

export type SplashEnterSnapshot = {
  mark: EnterBounds | null;
  wordmark: EnterBounds | null;
  greeting: EnterBounds | null;
};

let pendingSnapshot: SplashEnterSnapshot | null = null;
let completeListeners: Array<() => void> = [];

/** Avant `router.replace` — capture mark/wordmark/greeting splash. */
export function beginHomeEnterSession(): void {
  pendingSnapshot = {
    mark: readBounds(MARK_DOM.mark),
    wordmark: readBounds(MARK_DOM.wordmark),
    greeting: readBounds(MARK_DOM.greeting),
  };
}

/** Snapshot encore à jouer (survit à un cleanup Strict Mode). */
export function hasPendingHomeEnter(): boolean {
  return pendingSnapshot !== null;
}

/** Lit le snapshot sans le consommer (replay possible si kill avant fin). */
export function peekHomeEnterSnapshot(): SplashEnterSnapshot | null {
  return pendingSnapshot;
}

/** Fin réelle de la timeline — libère le pending. */
export function endHomeEnterSession(): void {
  pendingSnapshot = null;
  const listeners = completeListeners;
  completeListeners = [];
  for (const listener of listeners) {
    listener();
  }
}

/** Reset forcé (tests / récupération) — annule pending sans notifier. */
export function resetHomeEnterSession(): void {
  pendingSnapshot = null;
  completeListeners = [];
}

/** Callback fin d’enter (phase mark). */
export function onHomeEnterComplete(fn: () => void): () => void {
  if (!pendingSnapshot) {
    fn();
    return () => {};
  }
  completeListeners.push(fn);
  return () => {
    completeListeners = completeListeners.filter((listener) => listener !== fn);
  };
}
