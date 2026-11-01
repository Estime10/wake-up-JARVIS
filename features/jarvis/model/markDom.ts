export type MarkSlotName = "home" | "splash" | "terminal";

/**
 * Contrat DOM unique slots / textes handoff. Toutes les requêtes prennent
 * une racine explicite (scope du composant appelant) — jamais `document`
 * implicite dans le modèle. Le mark persistant, lui, arrive par ref
 * (`useJarvisShell().markRef`).
 */
export const MARK_DOM = {
  wordmark: '[data-intro="wordmark"]',
  greeting: '[data-intro="greeting"]',
  composer: '[data-home="composer"]',
  chrome: '[data-home="chrome"]',
} as const;

/**
 * `data-flip-id` partagés splash → home (ADR 0004) : même id sur le nœud
 * splash et sur le nœud home (ou le même nœud, pour le mark persistant).
 */
export const FLIP_ID = {
  mark: "mark",
  wordmark: "wordmark",
  greeting: "greeting",
} as const;

export function isElement(el: HTMLElement | null): el is HTMLElement {
  return el !== null;
}

export function queryMarkSlot(
  root: ParentNode,
  name: MarkSlotName,
): HTMLElement | null {
  return root.querySelector<HTMLElement>(`[data-mark-slot="${name}"]`);
}

export function queryWordmark(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>(MARK_DOM.wordmark);
}

export function queryGreeting(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>(MARK_DOM.greeting);
}

export function queryComposer(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>(MARK_DOM.composer);
}

export function queryChrome(root: ParentNode): HTMLElement | null {
  return root.querySelector<HTMLElement>(MARK_DOM.chrome);
}
