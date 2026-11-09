import { t } from "@/lib/i18n";

type RepoPreviewCodeProps = {
  content: string | undefined;
  masked: boolean;
};

/** Aperçu texte avec numéros de ligne (+ masquage secrets mock). */
export function RepoPreviewCode({ content, masked }: RepoPreviewCodeProps) {
  const lines = (content ?? t("home.repoPreviewEmptyContent")).split("\n");

  return (
    <pre className="t-mono text-sm leading-relaxed text-text">
      <code>
        {lines.map((line, index) => (
          <span key={index} className="flex gap-4">
            <span className="w-8 shrink-0 select-none text-right text-text tabular-nums">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap break-all">
              {masked && line.includes("RESEND_API_KEY") ? (
                <MaskedLine line={line} />
              ) : (
                line || " "
              )}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
}

function MaskedLine({ line }: { line: string }) {
  const [left] = line.split("=");
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>{left}=</span>
      <span className="inline-block h-4 w-40 rounded bg-text-muted/30 blur-[3px]" />
      <span className="t-label rounded border border-line px-1.5 py-0.5 text-[0.65rem] text-text">
        {t("home.repoPreviewMaskedChip")}
      </span>
    </span>
  );
}
