import { HudModal } from "@/components/ui/HudModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden";
import { t } from "@/lib/i18n";

/** Squelette gate auth — même enveloppe que `AuthModal`. */
export function AuthSkeleton() {
  return (
    <HudModal
      className="relative w-full max-w-md"
      aria-busy="true"
      aria-label={t("auth.loading")}
    >
      <div
        className="relative z-10 flex flex-col gap-5 px-5 py-4 sm:px-6 sm:py-5"
        role="status"
      >
        <VisuallyHidden>{t("auth.loading")}</VisuallyHidden>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full max-w-xs" />
        </div>
        <div className="flex gap-6 border-b border-line-subtle pb-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="mt-1 h-11 w-full rounded-md" />
        </div>
      </div>
    </HudModal>
  );
}
