import { RepoWarningIcon } from "@/features/home/components/repo/icons";
import { t } from "@/lib/i18n";

/** Bandeau avis jeton — état 1B. */
export function RepoPanelNotice() {
  return (
    <div
      role="status"
      className="mx-4 mb-1 flex items-start gap-2 rounded-md border border-attention/40 bg-attention/10 px-3 py-2"
    >
      <RepoWarningIcon className="mt-0.5 size-3.5 shrink-0 text-attention" />
      <p className="t-body text-sm text-attention">
        {t("home.repoNoticeToken")}
      </p>
    </div>
  );
}
