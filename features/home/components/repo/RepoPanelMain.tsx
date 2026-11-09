"use client";

import { useState } from "react";

import { RepoPanelDenied } from "@/features/home/components/repo/RepoPanelDenied";
import { RepoPanelDisconnected } from "@/features/home/components/repo/RepoPanelDisconnected";
import { RepoPanelError } from "@/features/home/components/repo/RepoPanelError";
import { RepoPanelLoading } from "@/features/home/components/repo/RepoPanelLoading";
import { LiveRepoPanelBody } from "@/features/github/components/LiveRepoPanelBody";
import { useGithubConnection } from "@/features/github/hooks/useGithubConnection";
import { githubPatErrorKey } from "@/features/github/model/githubPatErrorKey";
import type { MessageKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * Corps du tiroir fichiers — connexion + lecture GitHub live uniquement.
 */
export function RepoPanelMain() {
  const github = useGithubConnection();
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  async function handleConnect(input: {
    token: string;
    expiresAt?: string;
  }): Promise<void> {
    setSubmitting(true);
    setErrorKey(null);
    const result = await github.connect(input);
    setSubmitting(false);
    if (!result.ok) {
      setErrorKey(githubPatErrorKey(result.error));
    }
  }

  async function handleDisconnect(): Promise<void> {
    setDisconnecting(true);
    await github.disconnect();
    setDisconnecting(false);
  }

  const liveConnect = {
    submitting,
    errorKey,
    onConnect: handleConnect,
  };

  if (github.status === "unavailable") {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <p className="t-body text-sm text-text">
          {t("home.repoUnavailableTitle")}
        </p>
        <p className="t-body text-sm text-text">
          {t("home.repoUnavailableHint")}
        </p>
      </div>
    );
  }

  if (github.status === "loading") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelLoading />
      </div>
    );
  }

  if (github.status === "error") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelError
          repoName="GitHub"
          detail={t("home.repoPatErrorUpstream")}
          onRetry={github.refresh}
        />
      </div>
    );
  }

  if (github.status === "ready" && !github.connection) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelDisconnected live={liveConnect} />
      </div>
    );
  }

  if (
    github.status === "ready" &&
    github.connection?.status === "needs_reauth"
  ) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelDenied live={liveConnect} />
      </div>
    );
  }

  if (
    github.status === "ready" &&
    github.connection &&
    github.connection.status === "active"
  ) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <LiveRepoPanelBody
          login={github.connection.login}
          disconnecting={disconnecting}
          onDisconnect={() => {
            void handleDisconnect();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <RepoPanelLoading />
    </div>
  );
}
