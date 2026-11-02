import { formatPayloadDisplay } from "@/lib/actions/formatPayloadDisplay";
import { t } from "@/lib/i18n";

type SignaturePayloadProps = {
  raw: string;
};

/** JCS brut entier — cases U+XXXX pour contrôles / non-ASCII. */
export function SignaturePayload({ raw }: SignaturePayloadProps) {
  const segments = formatPayloadDisplay(raw);

  return (
    <div className="mt-3">
      <p className="t-mono text-sm text-text-muted">
        {t("actions.payloadLegend")}
      </p>
      <pre
        className="t-mono mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-line bg-surface-2 px-3 py-2 text-sm text-text"
        dir="ltr"
      >
        {segments.map((segment, index) =>
          segment.kind === "text" ? (
            <span key={`t-${index}`}>{segment.value}</span>
          ) : (
            <span
              key={`c-${index}`}
              className="mx-0.5 inline-block rounded-sm border border-line bg-surface-2 px-1 text-text-muted"
              title={segment.label}
            >
              {segment.label}
            </span>
          ),
        )}
      </pre>
    </div>
  );
}
