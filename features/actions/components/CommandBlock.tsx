import { CopyButton } from "@/components/ui/CopyButton";
import { t } from "@/lib/i18n";

type CommandBlockProps = {
  command: string;
};

/** Commande exacte en mono + Copier. */
export function CommandBlock({ command }: CommandBlockProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="t-label text-sm text-text-muted">
          {t("actions.command")}
        </p>
        <pre
          className="t-mono mt-1 overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-line-subtle bg-surface-2/60 px-3 py-2 text-sm text-text"
          dir="ltr"
        >
          {command}
        </pre>
      </div>
      <CopyButton text={command} />
    </div>
  );
}
