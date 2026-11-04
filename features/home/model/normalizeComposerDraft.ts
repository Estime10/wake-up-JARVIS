/** Aligné sur `assistant/reply` bodySchema text.max(300) — DEV-5. */
export const COMPOSER_DRAFT_MAX_CHARS = 300;

/** Texte envoyable — trim ; vide = non soumis. */
export function normalizeComposerDraft(raw: string): string {
  return raw.trim();
}

export function canSubmitComposerDraft(raw: string): boolean {
  return normalizeComposerDraft(raw).length > 0;
}
