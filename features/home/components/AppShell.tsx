"use client";

import type { ReactNode } from "react";

import { useHomeEnterMotion } from "@/features/home/hooks/useHomeEnterMotion";
import { t } from "@/lib/i18n";

type AppShellProps = {
  children: ReactNode;
  side: ReactNode;
};

/**
 * Coquille `(main)` — 75/25.
 * Motion entrée : `useHomeEnterMotion` (mark + panneau + chrome synchronisés).
 */
export function AppShell({ children, side }: AppShellProps) {
  const { shellRef, sideRef } = useHomeEnterMotion();

  return (
    <div
      ref={shellRef}
      className="grid h-dvh w-full overflow-hidden bg-bg text-text [grid-template-columns:minmax(0,100%)_minmax(0,0fr)]"
    >
      <section className="relative min-h-0 min-w-0">{children}</section>
      <aside
        ref={sideRef}
        className="relative flex min-h-0 min-w-0 flex-col will-change-transform"
        aria-label={t("home.sidePanelLabel")}
      >
        {side}
      </aside>
    </div>
  );
}
