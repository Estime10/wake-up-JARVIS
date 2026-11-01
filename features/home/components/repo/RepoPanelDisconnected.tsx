import { Button } from "@/components/ui/Button";
import { RepoPlugIcon } from "@/features/home/components/repo/icons";
import { t } from "@/lib/i18n";

type RepoPanelDisconnectedProps = {
  onConfig: () => void;
};

/** Accès GitHub non connecté — état 6. */
export function RepoPanelDisconnected({
  onConfig,
}: RepoPanelDisconnectedProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <RepoPlugIcon className="size-10 text-text-muted" />
      <div className="flex flex-col gap-1">
        <p className="t-body text-sm text-text">
          {t("home.repoDisconnectedTitle")}
        </p>
        <p className="t-body text-sm text-text-muted">
          {t("home.repoDisconnectedHint")}
        </p>
      </div>
      <Button variant="bordered" size="md" onClick={onConfig}>
        {t("home.repoSeeConfig")}
      </Button>
    </div>
  );
}
