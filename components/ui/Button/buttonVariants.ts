/** Classes Tailwind des variants / tailles — séparées du rendu (Open/Closed). */

export const BUTTON_VARIANT_CLASS = {
  /** Bouton clair nacré (CTA principal). */
  light:
    "bg-linear-to-b from-btn-light-top to-btn-light-bottom text-on-accent hover:brightness-105",
  /** Bordure ligne — secondaire. */
  bordered:
    "border border-line bg-transparent text-text hover:border-text-muted hover:bg-surface-2",
  /** Texte seul — ex. Passer. */
  ghost: "bg-transparent text-text hover:text-accent",
  /** Action dangereuse bordée. */
  danger: "border border-danger bg-transparent text-danger hover:bg-danger/10",
  /** Action dangereuse pleine. */
  dangerSolid: "bg-danger text-on-danger hover:brightness-110",
} as const;

export const BUTTON_SIZE_CLASS = {
  md: "min-h-touch min-w-touch px-4 py-2 text-sm",
  icon: "size-touch p-0",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASS;
export type ButtonSize = keyof typeof BUTTON_SIZE_CLASS;
