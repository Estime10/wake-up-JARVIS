import { Skeleton } from "@/components/ui/Skeleton";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { t } from "@/lib/i18n";

const LINE_WIDTHS = [
  "w-[58%]",
  "w-[71%]",
  "w-[64%]",
  "w-[82%]",
  "w-[55%]",
  "w-[76%]",
  "w-[69%]",
] as const;

/** Squelettes chargement repo — état 2 (pas de libellé visible). */
export function RepoPanelLoading() {
  return (
    <div
      className="flex flex-col gap-3 px-4 py-3"
      aria-busy="true"
      role="status"
    >
      <VisuallyHidden>{t("home.repoLoadingFiles")}</VisuallyHidden>
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
      {LINE_WIDTHS.map((widthClass) => (
        <Skeleton key={widthClass} className={`h-3 ${widthClass}`} />
      ))}
    </div>
  );
}
