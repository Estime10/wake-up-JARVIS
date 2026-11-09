"use client";

import { RepoPlugIcon } from "@/features/home/components/repo/icons";
import { RepoGithubConnectForm } from "@/features/github/components/RepoGithubConnectForm";
import type { MessageKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type RepoPanelDisconnectedProps = {
  live: {
    submitting: boolean;
    errorKey: MessageKey | null;
    onConnect: (input: { token: string; expiresAt?: string }) => Promise<void>;
  };
};

/** Accès GitHub non connecté — formulaire PAT. */
export function RepoPanelDisconnected({ live }: RepoPanelDisconnectedProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <RepoPlugIcon className="size-10 text-text" />
      <div className="flex flex-col gap-1">
        <p className="t-body text-sm text-text">
          {t("home.repoDisconnectedTitle")}
        </p>
        <p className="t-body text-sm text-text">
          {t("home.repoDisconnectedHint")}
        </p>
      </div>
      <RepoGithubConnectForm
        submitting={live.submitting}
        errorKey={live.errorKey}
        onSubmit={live.onConnect}
      />
    </div>
  );
}
