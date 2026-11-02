"use client";

import { Button } from "@/components/ui/Button";
import { RepoEmptyBoxIcon } from "@/features/home/components/repo/icons";
import { t } from "@/lib/i18n";

type RepoPanelEmptyReposProps = {
  onConfig?: () => void;
  /** Étape 1 live : connecté, lecture repos pas encore branchée. */
  live?: {
    login: string;
    disconnecting: boolean;
    onDisconnect: () => void;
  };
};

/** Aucun repo ouvert — état 3B (ou attente étape 2). */
export function RepoPanelEmptyRepos({
  onConfig,
  live,
}: RepoPanelEmptyReposProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <RepoEmptyBoxIcon className="size-10 text-text-muted" />
      <div className="flex flex-col gap-1">
        <p className="t-body text-sm text-text">
          {live ? t("home.repoConnectedTitle") : t("home.repoEmptyTitle")}
        </p>
        <p className="t-body text-sm text-text-muted">
          {live
            ? t("home.repoConnectedHint", { login: live.login })
            : t("home.repoEmptyHint")}
        </p>
      </div>
      {live ? (
        <Button
          variant="bordered"
          size="md"
          disabled={live.disconnecting}
          onClick={live.onDisconnect}
        >
          {live.disconnecting
            ? t("home.repoDisconnecting")
            : t("home.repoDisconnect")}
        </Button>
      ) : onConfig ? (
        <Button variant="bordered" size="md" onClick={onConfig}>
          {t("home.repoSeeConfig")}
        </Button>
      ) : null}
    </div>
  );
}
