"use client";

import { Button } from "@/components/ui/Button";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type SupabaseStudioBrowserProps = {
  studioUrl: string;
  onBack: () => void;
};

/**
 * Chrome browser dans le tiroir — iframe via proxy local (:54332)
 * qui retire `frame-ancestors` / `X-Frame-Options` de Studio.
 */
export function SupabaseStudioBrowser({
  studioUrl,
  onBack,
}: SupabaseStudioBrowserProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="bare"
          className={REPO_CHROME.closeButton}
          onClick={onBack}
        >
          {t("home.supabaseStudioBack")}
        </Button>
        <p className="t-mono text-sm tracking-wide text-text-muted uppercase">
          {t("home.supabaseStudioBrowserTitle")}
        </p>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-line-subtle bg-surface-2",
        )}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-line-subtle px-3 py-2">
          <span className="flex shrink-0 gap-1" aria-hidden>
            <span className="size-2 rounded-full bg-line" />
            <span className="size-2 rounded-full bg-line" />
            <span className="size-2 rounded-full bg-line" />
          </span>
          <p className="t-mono min-w-0 flex-1 truncate rounded bg-bg px-2 py-1 text-dial text-text-muted sm:text-sm">
            {studioUrl}
          </p>
        </div>

        <iframe
          title={t("home.supabaseStudioBrowserTitle")}
          src={studioUrl}
          className="min-h-0 w-full flex-1 border-0 bg-bg"
          allow="clipboard-read; clipboard-write"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}
