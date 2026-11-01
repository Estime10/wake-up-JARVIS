import { Button } from "@/components/ui/Button";
import {
  RepoEmptyBoxIcon,
  RepoFileIcon,
  RepoLockIcon,
  RepoOfflineDocIcon,
  RepoRetryIcon,
  RepoWarningIcon,
} from "@/features/home/components/repo/icons";
import { RepoPreviewCode } from "@/features/home/components/repo/RepoPreviewCode";
import { RepoPreviewMessage } from "@/features/home/components/repo/RepoPreviewMessage";
import type { RepoPreviewKind } from "@/features/home/model/repoPanelScenario";
import { t } from "@/lib/i18n";

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
      <div className="flex flex-col gap-3" aria-busy="true">
        <p className="t-mono text-sm text-text-muted">
          {t("home.repoPreviewLoading", {
            name: path.split("/").pop() ?? path,
          })}
        </p>
        {SKELETON_WIDTHS.map((widthClass, index) => (
          <div
            key={index}
            className={`h-3 animate-pulse rounded bg-surface-2 ${widthClass}`}
          />
        ))}
      </div>
    );
  }

  if (kind === "tooLarge") {
    return (
      <RepoPreviewMessage
        icon={<RepoEmptyBoxIcon className="size-10 text-text-muted" />}
        title={t("home.repoPreviewTooLargeTitle")}
        body={t("home.repoPreviewTooLargeBody")}
      />
    );
  }

  if (kind === "binary") {
    return (
      <RepoPreviewMessage
        icon={<RepoFileIcon className="size-10 text-text-muted" />}
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
        icon={<RepoLockIcon className="size-10 text-text-muted" />}
        title={t("home.repoPreviewProtectedTitle")}
        body={t("home.repoPreviewProtectedBody")}
      />
    );
  }

  if (kind === "offline") {
    return (
      <RepoPreviewMessage
        icon={<RepoOfflineDocIcon className="size-10 text-text-muted" />}
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
          <p className="t-body text-sm text-text">
            {t("home.repoPreviewErrorBody", { path })}
          </p>
          <p className="t-mono text-dial text-text-muted sm:text-sm">
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
