"use client";

import type { ReactNode } from "react";

import { HudAmbient } from "@/components/ui/HudAmbient";
import { useHomeEnterMotion } from "@/features/home/hooks/useHomeEnterMotion";
import { useMainFocusAfterIntro } from "@/features/home/hooks/useMainFocusAfterIntro";
import {
  MAIN_LANDMARK_ID,
  MAIN_TITLE_ID,
} from "@/features/home/model/landmarks";
import { t } from "@/lib/i18n";

type AppShellProps = {
  children: ReactNode;
  side: ReactNode;
  repo: ReactNode;
};

/**
 * Coquille `(main)` — 75/25 dès le premier paint (slot mark stable).
 * `HudAmbient` au shell : calque visible sur toute la grille (y compris
 * la colonne side pendant le slide d’entrée, côté transparent).
 * Panneau REPO : overlay gauche au-dessus du centre (pas de push layout).
 *
 * `main` SANS z-index : sinon stacking context qui enferme backdrop/modale
 * terminal (z-55/65) sous le PersistentMark (z-60) — mask au-dessus du
 * terminal et fermeture mark hors logique. HudAmbient reste sous le contenu
 * via son propre `z-0`.
 */
export function AppShell({ children, side, repo }: AppShellProps) {
  const { shellRef, sideRef } = useHomeEnterMotion();
  const mainRef = useMainFocusAfterIntro();

  return (
    <div
      ref={shellRef}
      className="relative grid h-dvh w-full overflow-hidden bg-bg text-text [grid-template-columns:minmax(0,75%)_minmax(0,25%)]"
    >
      <HudAmbient />
      {repo}

      <main
        ref={mainRef}
        id={MAIN_LANDMARK_ID}
        tabIndex={-1}
        aria-labelledby={MAIN_TITLE_ID}
        className="relative min-h-0 min-w-0 outline-none"
      >
        {children}
      </main>
      <aside
        ref={sideRef}
        className="relative z-10 flex min-h-0 min-w-0 flex-col will-change-transform"
        aria-label={t("home.sidePanelLabel")}
      >
        {side}
      </aside>
    </div>
  );
}
