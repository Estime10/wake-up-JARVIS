/** Texte envoyable — trim ; vide = non soumis. */
export function normalizeComposerDraft(raw: string): string {
  return raw.trim();
}

export function canSubmitComposerDraft(raw: string): boolean {
  return normalizeComposerDraft(raw).length > 0;
}
