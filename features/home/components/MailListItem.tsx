"use client";

import { resolveMailLabelColor } from "@/features/mail/model/mailLabelColors";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import type { MailSummary } from "@/lib/schemas";

type MailListItemProps = {
  mail: MailSummary;
  selected?: boolean;
  onSelect?: (mail: MailSummary) => void;
};

/** Ligne mail — texte uniquement (jamais de HTML mail). */
export function MailListItem({
  mail,
  selected = false,
  onSelect,
}: MailListItemProps) {
  const labelText = mail.category?.trim() || mail.flagReason?.trim() || null;
  const labelColor = resolveMailLabelColor(
    mail.category ?? mail.flagReason ?? undefined,
  );

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={t("home.mailOpenLabel", {
        subject: mail.subject || t("home.mailNoSubject"),
      })}
      onClick={() => onSelect?.(mail)}
      className={cn(
        "w-full rounded-md border border-line-subtle/80 bg-surface-2/30 px-3 py-3 text-left transition-colors",
        "hover:border-line-subtle hover:bg-surface-2/45",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        mail.unread && "border-accent/35 bg-surface-2/55",
        selected && "border-accent/60 bg-surface-2/70",
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
        <time className="t-mono shrink-0 text-sm text-text">{mail.time}</time>
      </div>
      <p
        className={cn(
          "t-mono mt-1.5 truncate text-sm leading-snug",
          mail.unread ? "text-text" : "text-text",
        )}
      >
        {mail.subject || t("home.mailNoSubject")}
      </p>
      {labelText ? (
        <p
          className={cn(
            "t-mono mt-1 truncate text-sm uppercase",
            !labelColor && "text-text",
          )}
          style={labelColor ? { color: labelColor } : undefined}
        >
          {labelText}
          {mail.flagReason && mail.category && mail.flagReason !== mail.category
            ? ` · ${mail.flagReason}`
            : null}
        </p>
      ) : null}
      <p className="t-mono mt-1 line-clamp-2 text-sm text-text">
        {mail.excerpt}
      </p>
    </button>
  );
}
