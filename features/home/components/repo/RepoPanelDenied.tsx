"use client";

import { RepoKeyBrokenIcon } from "@/features/home/components/repo/icons";
import { RepoGithubConnectForm } from "@/features/github/components/RepoGithubConnectForm";
import type { MessageKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type RepoPanelDeniedProps = {
  live: {
    submitting: boolean;
    errorKey: MessageKey | null;
    onConnect: (input: { token: string; expiresAt?: string }) => Promise<void>;
  };
};

/** Accès refusé / jeton expiré — reconnect PAT. */
export function RepoPanelDenied({ live }: RepoPanelDeniedProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <RepoKeyBrokenIcon className="size-10 text-danger" />
      <div className="flex flex-col gap-1">
        <p className="t-label text-sm text-danger">
          {t("home.repoDeniedTitle")}
        </p>
        <p className="t-body text-sm text-text">{t("home.repoDeniedHint")}</p>
      </div>
      <RepoGithubConnectForm
        submitting={live.submitting}
        errorKey={live.errorKey}
        onSubmit={live.onConnect}
      />
    </div>
  );
}
