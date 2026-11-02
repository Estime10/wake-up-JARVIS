"use client";

import { Button } from "@/components/ui/Button";
import { RepoKeyBrokenIcon } from "@/features/home/components/repo/icons";
import { RepoGithubConnectForm } from "@/features/github/components/RepoGithubConnectForm";
import type { MessageKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type RepoPanelDeniedProps = {
  onConfig?: () => void;
  live?: {
    submitting: boolean;
    errorKey: MessageKey | null;
    onConnect: (input: { token: string; expiresAt?: string }) => Promise<void>;
  };
};

/** Accès refusé / jeton expiré — état 7 + reconnect PAT. */
export function RepoPanelDenied({ onConfig, live }: RepoPanelDeniedProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <RepoKeyBrokenIcon className="size-10 text-danger" />
      <div className="flex flex-col gap-1">
        <p className="t-label text-sm text-danger">
          {t("home.repoDeniedTitle")}
        </p>
        <p className="t-body text-sm text-text-muted">
          {t("home.repoDeniedHint")}
        </p>
      </div>
      {live ? (
        <RepoGithubConnectForm
          submitting={live.submitting}
          errorKey={live.errorKey}
          onSubmit={live.onConnect}
        />
      ) : onConfig ? (
        <Button variant="bordered" size="md" onClick={onConfig}>
          {t("home.repoSeeConfig")}
        </Button>
      ) : null}
    </div>
  );
}
