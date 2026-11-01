import { t } from "@/lib/i18n";

/** Panneau droit 15 % — placeholder Journal / Mails. */
export function HomeSidePanel() {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface/40 px-3 py-4">
      <p className="t-label text-xs text-text-muted">{t("home.tabJournal")}</p>
      <p className="t-body mt-3 text-xs text-text-muted">
        {t("home.sideEmpty")}
      </p>
    </div>
  );
}
