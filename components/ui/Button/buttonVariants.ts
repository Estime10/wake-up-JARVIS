/** Classes Tailwind des variants / tailles — séparées du rendu (Open/Closed). */

export const BUTTON_VARIANT_CLASS = {
  /** Bouton clair nacré (CTA principal). */
  light:
    "t-label bg-linear-to-b from-btn-light-top to-btn-light-bottom text-on-accent hover:brightness-105",
  /** Bordure ligne — secondaire. */
  bordered:
    "t-label border border-line bg-transparent text-text hover:border-text-muted hover:bg-surface-2",
  /** Texte seul — ex. Passer. */
  ghost: "t-label bg-transparent text-text hover:text-accent",
  /** Action dangereuse bordée. */
  danger:
    "t-label border border-danger bg-transparent text-danger hover:bg-danger/10",
  /** Action dangereuse pleine. */
  dangerSolid: "t-label bg-danger text-on-danger hover:brightness-110",
  /** Lien HUD mono — méta coins (Terminal, etc.). */
  hud: "pointer-events-auto bg-transparent font-mono text-dial font-normal tracking-dial text-text-muted uppercase transition-colors hover:text-text sm:text-sm",
} as const;

export const BUTTON_SIZE_CLASS = {
  md: "min-h-touch min-w-touch px-4 py-2 text-sm",
  icon: "size-touch p-0",
  /** Affordance dial — pas de zone 44 px. */
  bare: "min-h-0 min-w-0 p-0",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT_CLASS;
export type ButtonSize = keyof typeof BUTTON_SIZE_CLASS;
