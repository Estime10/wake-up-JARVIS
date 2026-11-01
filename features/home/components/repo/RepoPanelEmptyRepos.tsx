import { Button } from "@/components/ui/Button";
import { RepoEmptyBoxIcon } from "@/features/home/components/repo/icons";
import { t } from "@/lib/i18n";

type RepoPanelEmptyReposProps = {
  onConfig?: () => void;
};

/** Aucun repo ouvert — état 3B. */
export function RepoPanelEmptyRepos({ onConfig }: RepoPanelEmptyReposProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <RepoEmptyBoxIcon className="size-10 text-text-muted" />
      <div className="flex flex-col gap-1">
        <p className="t-body text-sm text-text">{t("home.repoEmptyTitle")}</p>
        <p className="t-body text-sm text-text-muted">
          {t("home.repoEmptyHint")}
        </p>
      </div>
      {onConfig ? (
        <Button variant="bordered" size="md" onClick={onConfig}>
          {t("home.repoSeeConfig")}
        </Button>
      ) : null}
    </div>
  );
}
