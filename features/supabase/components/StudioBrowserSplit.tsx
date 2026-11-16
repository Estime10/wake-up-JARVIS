"use client";

import type { ReactNode } from "react";

import { SupabaseStudioBrowser } from "@/features/supabase/components/SupabaseStudioBrowser";
import { t } from "@/lib/i18n/t";

type StudioBrowserSplitProps = {
  /**
   * Legacy embed — toujours `null` désormais (Studio = navigateur système).
   * Conservé pour ne pas casser l’API du split.
   */
  studioUrl: string | null;
  topFallback?: ReactNode;
};

/**
 * Colonne droite : comptes (Studio s’ouvre dans le navigateur).
 */
export function StudioBrowserSplit({
  studioUrl,
  topFallback = null,
}: StudioBrowserSplitProps) {
  if (studioUrl) {
    return (
      <div
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
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
