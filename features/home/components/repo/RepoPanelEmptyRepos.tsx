"use client";

import { Button } from "@/components/ui/Button";
import { RepoEmptyBoxIcon } from "@/features/home/components/repo/icons";
import { t } from "@/lib/i18n";

type RepoPanelEmptyReposProps = {
  live: {
    login: string;
    disconnecting: boolean;
    onDisconnect: () => void;
  };
};

/** Aucun repo accessible avec le PAT courant. */
export function RepoPanelEmptyRepos({ live }: RepoPanelEmptyReposProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <RepoEmptyBoxIcon className="size-10 text-text-muted" />
      <div className="flex flex-col gap-1">
        <p className="t-body text-sm text-text">{t("home.repoEmptyTitle")}</p>
        <p className="t-body text-sm text-text-muted">
          {t("home.repoConnectedHint", { login: live.login })}
        </p>
      </div>
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
    </div>
  );
}
