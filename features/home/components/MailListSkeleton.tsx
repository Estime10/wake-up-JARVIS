import { Skeleton } from "@/components/ui/Skeleton";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { t } from "@/lib/i18n";

const ROWS = [
  {
    from: "h-3.5 w-28",
    subject: "mt-2.5 h-3.5 w-4/5",
    excerpt: "mt-2 h-3 w-full",
  },
  {
    from: "h-3.5 w-24",
    subject: "mt-2.5 h-3.5 w-3/5",
    excerpt: "mt-2 h-3 w-5/6",
  },
  {
    from: "h-3.5 w-32",
    subject: "mt-2.5 h-3.5 w-2/3",
    excerpt: "mt-2 h-3 w-4/5",
  },
] as const;

/** Squelette liste mails — même gabarit que `MailListItem`. */
export function MailListSkeleton() {
  return (
    <ul className="flex flex-col gap-2" aria-busy="true" role="status">
      <VisuallyHidden>{t("home.mailLoading")}</VisuallyHidden>
      {ROWS.map((row) => (
        <li key={row.from}>
          <div className="rounded-md border border-line-subtle/80 bg-surface-2/30 px-3 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <Skeleton className={row.from} />
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
            <Skeleton className={row.subject} />
            <Skeleton className={row.excerpt} />
            <Skeleton className="mt-1.5 h-3 w-2/3" />
          </div>
        </li>
      ))}
    </ul>
  );
}
