import { Skeleton } from "@/components/ui/Skeleton";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { t } from "@/lib/i18n";

/** Squelette fil conversation — remplace le libellé « Chargement… ». */
export function ConversationSkeleton() {
  return (
    <div
      className="flex min-h-0 w-full max-w-xl flex-1 flex-col justify-center gap-4 px-6 py-4"
      aria-busy="true"
      role="status"
    >
      <VisuallyHidden>{t("home.conversationLoading")}</VisuallyHidden>
      <div className="flex flex-col gap-2 self-start">
        <Skeleton className="h-3 w-28 rounded-sm bg-surface-2/80" />
        <Skeleton className="h-14 w-[min(100%,18rem)] rounded-md" />
      </div>
      <div className="flex flex-col items-end gap-2 self-end">
        <Skeleton className="h-3 w-20 rounded-sm bg-surface-2/80" />
        <Skeleton className="h-10 w-[min(100%,12rem)] rounded-md" />
      </div>
      <div className="flex flex-col gap-2 self-start">
        <Skeleton className="h-3 w-24 rounded-sm bg-surface-2/80" />
        <Skeleton className="h-20 w-[min(100%,20rem)] rounded-md" />
      </div>
    </div>
  );
}
