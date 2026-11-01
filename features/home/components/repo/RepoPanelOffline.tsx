import { t } from "@/lib/i18n";

/** Bandeau hors ligne — état 5. */
export function RepoPanelOffline() {
  return (
    <div
      role="status"
      className="mx-4 rounded-md border border-line bg-surface-2 px-3 py-2"
    >
      <p className="t-body text-sm text-text-muted">
        {t("home.repoOfflineNotice")}
      </p>
    </div>
  );
}
