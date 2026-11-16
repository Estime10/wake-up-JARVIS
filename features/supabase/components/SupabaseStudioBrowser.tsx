"use client";

import { isCloudStudioUrl } from "@/lib/supabase/platform/cloudStudioUrl";
import { t } from "@/lib/i18n/t";

type SupabaseStudioBrowserProps = {
  studioUrl: string;
};

/**
 * Fallback web si un embed était encore demandé — le flux nominal ouvre
 * le navigateur système (`openExternalUrl`).
 */
export function SupabaseStudioBrowser({
  studioUrl,
}: SupabaseStudioBrowserProps) {
  if (isCloudStudioUrl(studioUrl)) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="t-content text-base leading-snug">
          {t("home.supabaseStudioBrowserTitle")}
        </p>
        <a
          href={studioUrl}
          target="_blank"
          rel="noreferrer"
          className="t-label text-accent hover:text-text"
        >
          {studioUrl}
        </a>
      </div>
    );
  }

  return (
    <iframe
      title={t("home.supabaseStudioBrowserTitle")}
      src={studioUrl}
      className="h-full min-h-0 w-full flex-1 border-0 bg-transparent"
      allow="clipboard-read; clipboard-write"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}
