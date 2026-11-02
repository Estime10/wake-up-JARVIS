import { t } from "@/lib/i18n";

type ActionOutputProps = {
  lines: readonly string[];
  running: boolean;
  exitCode?: number | undefined;
};

/** Sortie d'exécution — `role="log"`. */
export function ActionOutput({ lines, running, exitCode }: ActionOutputProps) {
  if (lines.length === 0 && !running && exitCode === undefined) {
    return null;
  }

  return (
    <div className="mt-3">
      <p className="t-label text-sm text-text-muted">
        {t("actions.outputLabel")}
      </p>
      <pre
        className="t-mono mt-1 max-h-40 overflow-y-auto rounded-md border border-line-subtle bg-bg/80 px-3 py-2 text-sm text-text"
        role="log"
        aria-live="polite"
        dir="ltr"
      >
        {lines.join("\n")}
        {running ? "\n…" : null}
        {exitCode !== undefined && !running ? `\n[exit ${exitCode}]` : null}
      </pre>
    </div>
  );
}
