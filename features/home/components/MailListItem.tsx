import type { MockMail } from "@/fixtures/mails";
import { cn } from "@/lib/cn";

type MailListItemProps = {
  mail: MockMail;
};

/** Ligne mail — texte uniquement (jamais de HTML mail). */
export function MailListItem({ mail }: MailListItemProps) {
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
        <time className="t-mono shrink-0 text-xs text-text-muted">
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
      <p className="t-mono mt-1 line-clamp-2 text-xs text-text-muted">
        {mail.excerpt}
      </p>
    </article>
  );
}
