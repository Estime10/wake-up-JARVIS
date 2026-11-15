import { Button } from "@/components/ui/Button/Button";
import { RepoRetryIcon } from "@/features/home/components/ui/repo/icons/RepoRetryIcon";
import { RepoWarningIcon } from "@/features/home/components/ui/repo/icons/RepoWarningIcon";
import { t } from "@/lib/i18n/t";

type RepoPanelErrorProps = {
  repoName: string;
  detail: string;
  onRetry: () => void;
};

/** Erreur chargement — état 4. */
export function RepoPanelError({
  repoName,
  detail,
  onRetry,
}: RepoPanelErrorProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div
        role="alert"
        className="flex flex-col gap-2 rounded-md border border-danger/50 bg-danger/10 px-3 py-3"
      >
        <div className="flex items-center gap-2 text-danger">
          <RepoWarningIcon className="size-3.5 shrink-0" />
          <p className="t-label text-sm">{t("home.repoErrorTitle")}</p>
        </div>
        <p className="t-content text-base leading-snug">
          {t("home.repoErrorBody", { repo: repoName })}
        </p>
        <p className="t-mono text-dial text-text sm:text-sm">{detail}</p>
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
