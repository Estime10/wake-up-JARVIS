"use client";

import { t } from "@/lib/i18n";

type SupabaseStudioBrowserProps = {
  studioUrl: string;
};

/**
 * Surface Studio — iframe via proxy :54332.
 * Chrome retour = bandeau colonne (HomeSupabasePane), aligné nav.
 */
export function SupabaseStudioBrowser({
  studioUrl,
}: SupabaseStudioBrowserProps) {
  return (
    <iframe
      title={t("home.supabaseStudioBrowserTitle")}
      src={studioUrl}
      className="min-h-0 w-full flex-1 border-0 bg-transparent"
      allow="clipboard-read; clipboard-write"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
