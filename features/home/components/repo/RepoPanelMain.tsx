"use client";

import { useState, type KeyboardEvent, type MutableRefObject } from "react";

import { Button } from "@/components/ui/Button";
import { RepoPanelDenied } from "@/features/home/components/repo/RepoPanelDenied";
import { RepoPanelDisconnected } from "@/features/home/components/repo/RepoPanelDisconnected";
import { RepoPanelEmptyRepos } from "@/features/home/components/repo/RepoPanelEmptyRepos";
import { RepoPanelError } from "@/features/home/components/repo/RepoPanelError";
import { RepoPanelLoading } from "@/features/home/components/repo/RepoPanelLoading";
import { RepoTabContent } from "@/features/home/components/repo/RepoTabContent";
import { useRepoSession } from "@/features/home/context";
import { LiveRepoPanelBody } from "@/features/github/components/LiveRepoPanelBody";
import { useGithubConnection } from "@/features/github/hooks/useGithubConnection";
import { githubPatErrorKey } from "@/features/github/model/githubPatErrorKey";
import { REPO_TABS, type RepoTab } from "@/features/home/model/repoTab";
import { REPO_TAB_LABEL_KEY } from "@/features/home/model/repoTabsUi";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type RepoPanelMainProps = {
  tabId: (value: RepoTab) => string;
  panelId: string;
  tabRefs: MutableRefObject<Partial<Record<RepoTab, HTMLButtonElement>>>;
  onTabKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

/** Corps du tiroir fichiers — live GitHub (étape 1) ou scénarios mock. */
export function RepoPanelMain({
  tabId,
  panelId,
  tabRefs,
  onTabKeyDown,
}: RepoPanelMainProps) {
  const session = useRepoSession();
  const github = useGithubConnection();
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [errorKey, setErrorKey] = useState<MessageKey | null>(null);

  const live = github.status !== "unavailable";

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

  if (live && (github.status === "loading" || session.scenario === "loading")) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelLoading />
      </div>
    );
  }

  if (live && github.status === "error") {
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

  if (live && github.status === "ready" && !github.connection) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelDisconnected live={liveConnect} />
      </div>
    );
  }

  if (
    live &&
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
    live &&
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

  if (session.scenario === "loading") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelLoading />
      </div>
    );
  }

  if (session.scenario === "disconnected") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelDisconnected onConfig={session.goNominal} />
      </div>
    );
  }

  if (session.scenario === "denied") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelDenied onConfig={session.goNominal} />
      </div>
    );
  }

  if (session.scenario === "emptyRepos") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelEmptyRepos onConfig={session.goNominal} />
      </div>
    );
  }

  if (session.scenario === "error") {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        <RepoPanelError
          repoName={session.repo?.name ?? "—"}
          detail={t("home.repoErrorDetail")}
          onRetry={session.retryPanel}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        session.scenario === "offline" && "opacity-80",
      )}
    >
      <div
        role="tablist"
        aria-label={t("home.repoTabsLabel")}
        className="flex shrink-0 gap-5 border-b border-line-subtle px-4 pt-3"
        onKeyDown={onTabKeyDown}
      >
        {REPO_TABS.map((value) => (
          <Button
            key={value}
            ref={(node) => {
              if (node) {
                tabRefs.current[value] = node;
              } else {
                delete tabRefs.current[value];
              }
            }}
            id={tabId(value)}
            variant="tab"
            size="tab"
            role="tab"
            aria-selected={session.tab === value}
            aria-controls={panelId}
            tabIndex={session.tab === value ? 0 : -1}
            onClick={() => session.setTab(value)}
          >
            {t(REPO_TAB_LABEL_KEY[value])}
          </Button>
        ))}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(session.tab)}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-3"
      >
        <RepoTabContent />
      </div>
    </div>
  );
}
