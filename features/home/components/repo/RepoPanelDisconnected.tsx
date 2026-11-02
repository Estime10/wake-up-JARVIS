"use client";

import { Button } from "@/components/ui/Button";
import { RepoPlugIcon } from "@/features/home/components/repo/icons";
import { RepoGithubConnectForm } from "@/features/github/components/RepoGithubConnectForm";
import type { MessageKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type RepoPanelDisconnectedProps = {
  /** Mode mock /dev : bouton config sans formulaire live. */
  onConfig?: () => void;
  live?: {
    submitting: boolean;
    errorKey: MessageKey | null;
    onConnect: (input: { token: string; expiresAt?: string }) => Promise<void>;
  };
};

/** Accès GitHub non connecté — état 6 + formulaire PAT (étape 1). */
export function RepoPanelDisconnected({
  onConfig,
  live,
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
