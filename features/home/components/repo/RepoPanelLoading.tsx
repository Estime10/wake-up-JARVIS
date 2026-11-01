import { t } from "@/lib/i18n";

/** Squelettes chargement — état 2. */
export function RepoPanelLoading() {
  return (
    <div className="flex flex-col gap-3 px-4 py-3" aria-busy="true">
      <p className="t-mono text-sm text-text-muted">
        {t("home.repoLoadingFiles")}
      </p>
      <div className="h-10 animate-pulse rounded-md bg-surface-2" />
      <div className="flex gap-4">
        <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-10 animate-pulse rounded bg-surface-2" />
      </div>
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className="h-3 animate-pulse rounded bg-surface-2"
          style={{ width: `${55 + ((index * 17) % 40)}%` }}
        />
      ))}
    </div>
  );
}
