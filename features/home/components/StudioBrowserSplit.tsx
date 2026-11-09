"use client";

import { useEffect, type ReactNode } from "react";

import { SupabaseStudioBrowser } from "@/features/home/components/SupabaseStudioBrowser";
import { useIsTauriClient } from "@/features/home/hooks/useIsTauriClient";
import { clearBrowserWebviewPane } from "@/features/home/tauri/webviewPane";
import { t } from "@/lib/i18n";

type StudioBrowserSplitProps = {
  /** Studio ouvert → plein panneau. `null` → `topFallback` (comptes). */
  studioUrl: string | null;
  topFallback?: ReactNode;
};

/**
 * Colonne droite entière : Studio **ou** comptes (plus de navigateur libre).
 */
export function StudioBrowserSplit({
  studioUrl,
  topFallback = null,
}: StudioBrowserSplitProps) {
  const native = useIsTauriClient();

  useEffect(() => {
    if (!native) {
      return;
    }
    // Ferme un éventuel child `elsa-browser` restant d’une session précédente.
    void clearBrowserWebviewPane().catch(() => {
      /* hors shell */
    });
  }, [native]);

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
