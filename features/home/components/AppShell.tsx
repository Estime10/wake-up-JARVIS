"use client";

import type { ReactNode } from "react";

import { HudAmbient } from "@/components/ui/HudAmbient";
import { HomeEnterProvider } from "@/features/home/context/HomeEnterProvider";
import { useHomeEnterMotion } from "@/features/home/hooks/useHomeEnterMotion";
import { useMainFocusAfterIntro } from "@/features/home/hooks/useMainFocusAfterIntro";
import {
  MAIN_LANDMARK_ID,
  MAIN_TITLE_ID,
} from "@/features/home/model/landmarks";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type AppShellProps = {
  children: ReactNode;
  side: ReactNode;
  repo: ReactNode;
};

/**
 * Coquille `(main)` — briefing plein centre, puis grille 75/25 au settle.
 */
export function AppShell({ children, side, repo }: AppShellProps) {
  const { shellRef, sideRef, phase, briefingReady, beginSettle } =
    useHomeEnterMotion();
  const mainRef = useMainFocusAfterIntro();
  const briefing = phase === "briefing";

  return (
    <HomeEnterProvider
      phase={phase}
      briefingReady={briefingReady}
      beginSettle={beginSettle}
    >
      <div
        ref={shellRef}
        className={cn(
          "relative grid h-dvh w-full overflow-hidden bg-bg text-text",
          briefing
            ? "[grid-template-columns:minmax(0,1fr)_0px]"
            : "[grid-template-columns:minmax(0,75%)_minmax(0,25%)]",
        )}
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
          className="relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden will-change-transform"
          aria-label={t("home.sidePanelLabel")}
          aria-hidden={briefing || undefined}
        >
          {side}
        </aside>
      </div>
    </HomeEnterProvider>
  );
}
