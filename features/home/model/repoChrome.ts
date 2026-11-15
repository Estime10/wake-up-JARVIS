/**
 * Chrome partagé panels liquid-glass (mail / github) — liste + détail.
 * Même `pt` / `px` que `HOME_SIDE_CONTENT_PAD` (p-4).
 */
export const REPO_CHROME = {
  header:
    "flex shrink-0 items-center border-b border-line-subtle px-4 pt-4 pb-2",
  footer:
    "flex shrink-0 items-center border-t border-line-subtle px-4 pt-2 pb-4",
  footerText: "t-mono flex min-h-touch items-center text-text-muted",
  closeButton: "t-label min-h-touch shrink-0 text-text hover:text-accent",
} as const;
