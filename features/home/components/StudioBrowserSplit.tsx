"use client";

import type { ReactNode } from "react";

import { SupabaseStudioBrowser } from "@/features/home/components/SupabaseStudioBrowser";
import { t } from "@/lib/i18n";

type StudioBrowserSplitProps = {
  /** Studio ouvert → plein panneau. `null` → `topFallback` (comptes). */
  studioUrl: string | null;
  topFallback?: ReactNode;
};

/**
 * Colonne droite entière : Studio plein panneau **ou** comptes.
 */
export function StudioBrowserSplit({
  studioUrl,
  topFallback = null,
}: StudioBrowserSplitProps) {
  if (studioUrl) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 flex-col"
        aria-label={t("home.sideBrowserStudioLabel")}
      >
        <SupabaseStudioBrowser studioUrl={studioUrl} />
      </div>
    );
  }

  if (topFallback) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {topFallback}
      </div>
    );
  }

  return null;
}
