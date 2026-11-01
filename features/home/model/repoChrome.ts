/**
 * Chrome layout partagé tiroir fichiers ↔ aperçu.
 * Motion → `features/home/animations` (pas ici).
 */
export const REPO_CHROME = {
  header: "flex shrink-0 items-center border-b border-line-subtle px-4 py-3",
  footer: "flex shrink-0 items-center border-t border-line-subtle px-4 py-3",
  footerText:
    "t-mono flex min-h-touch items-center text-dial text-text-muted sm:text-sm",
  closeButton:
    "t-label min-h-touch shrink-0 text-sm text-text-muted hover:text-text",
} as const;
