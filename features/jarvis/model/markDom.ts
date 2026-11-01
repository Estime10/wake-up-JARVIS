export type EnterBounds = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type MarkSlotName = "home" | "splash";

/** Contrat DOM unique du mark / slots / textes handoff. */
export const MARK_DOM = {
  mark: '[data-jarvis-mark="ring"]',
  wordmark: '[data-intro="wordmark"]',
  greeting: '[data-intro="greeting"]',
  composer: '[data-home="composer"]',
  chrome: '[data-home="chrome"]',
  ringDial: "[data-jarvis='ring-dial']",
} as const;

export function toBounds(rect: DOMRectReadOnly): EnterBounds {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function readBounds(selector: string): EnterBounds | null {
  const el = document.querySelector(selector);
  if (!el) {
    return null;
  }
  return toBounds(el.getBoundingClientRect());
}

export function queryMark(): HTMLElement | null {
  return document.querySelector<HTMLElement>(MARK_DOM.mark);
}

export function queryMarkSlot(name: MarkSlotName): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-mark-slot="${name}"]`);
}

export function queryWordmark(): HTMLElement | null {
  return document.querySelector<HTMLElement>(MARK_DOM.wordmark);
}

export function queryGreeting(): HTMLElement | null {
  return document.querySelector<HTMLElement>(MARK_DOM.greeting);
}

export function queryComposer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(MARK_DOM.composer);
}

export function queryChrome(): HTMLElement | null {
  return document.querySelector<HTMLElement>(MARK_DOM.chrome);
}
