"use client";

import { Button } from "@/components/ui/Button";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { t } from "@/lib/i18n";

type SupabaseStudioBrowserProps = {
  studioUrl: string;
  onBack: () => void;
};

/**
 * Surface Studio — iframe via proxy :54332, chrome minimal (pas de « fenêtre »).
 */
export function SupabaseStudioBrowser({
  studioUrl,
  onBack,
}: SupabaseStudioBrowserProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="bare"
          className={REPO_CHROME.closeButton}
          onClick={onBack}
        >
          {t("home.supabaseStudioBack")}
        </Button>
        <p className="t-mono min-w-0 truncate text-dial text-text-muted sm:text-sm">
          {studioUrl}
        </p>
      </div>

      <iframe
        title={t("home.supabaseStudioBrowserTitle")}
        src={studioUrl}
        className="min-h-0 w-full flex-1 border-0 bg-transparent"
        allow="clipboard-read; clipboard-write"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
