"use client";

import { t } from "@/lib/i18n";

type TerminalCtaProps = {
  onClick?: (() => void) | undefined;
};

/**
 * CTA Terminal — texte HUD seul (même famille que le méta coin haut droit).
 */
export function TerminalCta({ onClick }: TerminalCtaProps) {
  return (
    <button
      type="button"
      aria-label={t("home.terminalLabel")}
      onClick={onClick}
      className="t-mono pointer-events-auto cursor-pointer text-dial text-text-muted uppercase transition-colors hover:text-text sm:text-sm"
    >
      {t("home.terminal")}
    </button>
  );
}
