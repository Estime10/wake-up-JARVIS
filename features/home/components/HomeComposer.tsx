import { t } from "@/lib/i18n";

/** Barre de saisie home (squelette) — remonte dans la composition. */
export function HomeComposer() {
  return (
    <div className="w-full max-w-xl px-6">
      <label htmlFor="composer" className="sr-only">
        {t("home.composerLabel")}
      </label>
      <div className="flex items-center gap-2 rounded-md border border-line bg-surface/80 px-3 py-2 shadow-glass backdrop-blur-md">
        <input
          id="composer"
          type="text"
          disabled
          placeholder={t("home.composerPlaceholder")}
          className="t-body min-h-touch w-full bg-transparent text-text placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm bg-accent text-on-accent"
          aria-hidden
        >
          →
        </span>
      </div>
      <p className="t-mono mt-2 text-center text-xs text-text-muted">
        {t("home.composerHints")}
      </p>
    </div>
  );
}
