import { Button } from "@/components/ui/Button";
import {
  RepoRetryIcon,
  RepoWarningIcon,
} from "@/features/home/components/repo/icons";
import { t } from "@/lib/i18n";

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
        <p className="t-body text-sm text-text">
          {t("home.repoErrorBody", { repo: repoName })}
        </p>
        <p className="t-mono text-dial text-text-muted sm:text-sm">{detail}</p>
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
