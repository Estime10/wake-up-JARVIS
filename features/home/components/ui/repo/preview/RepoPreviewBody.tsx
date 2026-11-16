import { Button } from "@/components/ui/Button/Button";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { VisuallyHidden } from "@/components/ui/VisuallyHidden/VisuallyHidden";
import { RepoEmptyBoxIcon } from "@/features/home/components/ui/repo/icons/RepoEmptyBoxIcon";
import { RepoFileIcon } from "@/features/home/components/ui/repo/icons/RepoFileIcon";
import { RepoLockIcon } from "@/features/home/components/ui/repo/icons/RepoLockIcon";
import { RepoOfflineDocIcon } from "@/features/home/components/ui/repo/icons/RepoOfflineDocIcon";
import { RepoRetryIcon } from "@/features/home/components/ui/repo/icons/RepoRetryIcon";
import { RepoWarningIcon } from "@/features/home/components/ui/repo/icons/RepoWarningIcon";
import { RepoPreviewCode } from "@/features/home/components/ui/repo/preview/RepoPreviewCode";
import { RepoPreviewMessage } from "@/features/home/components/ui/repo/preview/RepoPreviewMessage";
import type { RepoPreviewKind } from "@/features/home/model/repoPanelScenario";
import { t } from "@/lib/i18n/t";

const SKELETON_WIDTHS = [
  "w-[40%]",
  "w-[53%]",
  "w-[66%]",
  "w-[79%]",
  "w-[42%]",
  "w-[55%]",
  "w-[68%]",
  "w-[81%]",
] as const;

type RepoPreviewBodyProps = {
  kind: RepoPreviewKind;
  path: string;
  content?: string;
  onRetry: () => void;
};

/** Corps aperçu selon le kind mock. */
export function RepoPreviewBody({
  kind,
  path,
  content,
  onRetry,
}: RepoPreviewBodyProps) {
  if (kind === "loading") {
    return (
      <div className="flex flex-col gap-3" aria-busy="true" role="status">
        <VisuallyHidden>
          {t("home.repoPreviewLoading", {
            name: path.split("/").pop() ?? path,
          })}
        </VisuallyHidden>
        {SKELETON_WIDTHS.map((widthClass) => (
          <Skeleton key={widthClass} className={`h-3 ${widthClass}`} />
        ))}
      </div>
    );
  }

  if (kind === "tooLarge") {
    return (
      <RepoPreviewMessage
        icon={<RepoEmptyBoxIcon className="size-10 text-text" />}
        title={t("home.repoPreviewTooLargeTitle")}
        body={t("home.repoPreviewTooLargeBody")}
      />
    );
  }

  if (kind === "binary") {
    return (
      <RepoPreviewMessage
        icon={<RepoFileIcon className="size-10 text-text" />}
        title={t("home.repoPreviewBinaryTitle")}
        body={t("home.repoPreviewBinaryBody", {
          name: path.split("/").pop() ?? path,
        })}
      />
    );
  }

  if (kind === "protected") {
    return (
      <RepoPreviewMessage
        icon={<RepoLockIcon className="size-10 text-text" />}
        title={t("home.repoPreviewProtectedTitle")}
        body={t("home.repoPreviewProtectedBody")}
      />
    );
  }

  if (kind === "offline") {
    return (
      <RepoPreviewMessage
        icon={<RepoOfflineDocIcon className="size-10 text-text" />}
        title={t("home.repoPreviewOfflineTitle")}
        body={t("home.repoPreviewOfflineBody")}
      />
    );
  }

  if (kind === "error") {
    return (
      <div className="flex max-w-md flex-col gap-3">
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-md border border-danger/50 bg-danger/10 px-3 py-3"
        >
          <div className="flex items-center gap-2 text-danger">
            <RepoWarningIcon className="size-3.5 shrink-0" />
            <p className="t-label text-sm">{t("home.repoErrorTitle")}</p>
          </div>
          <p className="t-content text-base leading-snug">
            {t("home.repoPreviewErrorBody", { path })}
          </p>
          <p className="t-mono text-dial text-text sm:text-sm">
            {t("home.repoPreviewErrorDetail")}
          </p>
        </div>
        <Button
          variant="bordered"
          size="md"
          className="self-start"
          onClick={onRetry}
        >
          <RepoRetryIcon className="size-3.5" />
          {t("home.repoRetry")}
        </Button>
      </div>
    );
  }

  return <RepoPreviewCode content={content} masked={kind === "masked"} />;
}
