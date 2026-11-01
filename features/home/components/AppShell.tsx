"use client";

import type { ReactNode } from "react";

import { useSidePanelOpen } from "@/features/home/hooks/useSidePanelOpen";
import { t } from "@/lib/i18n";

type AppShellProps = {
  children: ReactNode;
  side: ReactNode;
};

/**
 * Coquille `(main)` — 75/25.
 * Motion déléguée à `useSidePanelOpen` (pas de GSAP ici).
 */
export function AppShell({ children, side }: AppShellProps) {
  const { shellRef, sideRef } = useSidePanelOpen();

  return (
    <div
      ref={shellRef}
      className="grid h-dvh w-full overflow-hidden bg-bg text-text [grid-template-columns:minmax(0,75%)_minmax(0,25%)]"
    >
      <section className="relative min-h-0 min-w-0">{children}</section>
      <aside
        ref={sideRef}
        className="relative flex min-h-0 min-w-0 flex-col border-l border-line-subtle will-change-transform"
        aria-label={t("home.sidePanelLabel")}
      >
        {side}
      </aside>
    </div>
  );
}
