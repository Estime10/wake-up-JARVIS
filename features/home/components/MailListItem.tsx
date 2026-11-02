import { resolveMailLabelColor } from "@/features/mail/model/mailLabelColors";
import { cn } from "@/lib/cn";
import type { MailSummary } from "@/lib/schemas";

type MailListItemProps = {
  mail: MailSummary;
};

/** Ligne mail — texte uniquement (jamais de HTML mail). */
export function MailListItem({ mail }: MailListItemProps) {
  const labelText = mail.category?.trim() || mail.flagReason?.trim() || null;
  const labelColor = resolveMailLabelColor(
    mail.category ?? mail.flagReason ?? undefined,
  );

  return (
    <article
      className={cn(
        "rounded-md border border-line-subtle/80 bg-surface-2/30 px-3 py-3",
        mail.unread && "border-accent/35 bg-surface-2/55",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p
          className={cn(
            "t-mono truncate text-sm",
            mail.unread ? "font-medium text-accent" : "text-text",
          )}
        >
          {mail.from}
        </p>
        <time className="t-mono shrink-0 text-sm text-text-muted">
          {mail.time}
        </time>
      </div>
      <p
        className={cn(
          "t-mono mt-1.5 truncate text-sm leading-snug",
          mail.unread ? "text-text" : "text-text-muted",
        )}
      >
        {mail.subject}
      </p>
      {labelText ? (
        <p
          className={cn(
            "t-mono mt-1 truncate text-sm uppercase",
            !labelColor && "text-text-muted",
          )}
          style={labelColor ? { color: labelColor } : undefined}
        >
          {labelText}
          {mail.flagReason && mail.category && mail.flagReason !== mail.category
            ? ` · ${mail.flagReason}`
            : null}
        </p>
      ) : null}
      <p className="t-mono mt-1 line-clamp-2 text-sm text-text-muted">
        {mail.excerpt}
      </p>
    </article>
  );
}
