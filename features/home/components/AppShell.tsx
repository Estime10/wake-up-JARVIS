"use client";

import type { ReactNode } from "react";

import { useHomeEnterMotion } from "@/features/home/hooks/useHomeEnterMotion";
import { useMainFocusAfterIntro } from "@/features/home/hooks/useMainFocusAfterIntro";
import { MAIN_TITLE_ID } from "@/features/home/model/landmarks";
import { t } from "@/lib/i18n";

type AppShellProps = {
  children: ReactNode;
  side: ReactNode;
};

/**
 * Coquille `(main)` — 75/25 dès le premier paint (slot mark stable).
 * Motion entrée : `useHomeEnterMotion`.
 */
export function AppShell({ children, side }: AppShellProps) {
  const { shellRef, sideRef } = useHomeEnterMotion();
  const mainRef = useMainFocusAfterIntro();

  return (
    <div
      ref={shellRef}
      className="grid h-dvh w-full overflow-hidden bg-bg text-text [grid-template-columns:minmax(0,75%)_minmax(0,25%)]"
    >
      <main
        ref={mainRef}
        id="main"
        tabIndex={-1}
        aria-labelledby={MAIN_TITLE_ID}
        className="relative min-h-0 min-w-0 outline-none"
      >
        {children}
      </main>
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
