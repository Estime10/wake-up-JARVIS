"use client";

import type { KeyboardEvent, MutableRefObject } from "react";

import { Button } from "@/components/ui/Button";
import { RepoPanelMain } from "@/features/home/components/repo/RepoPanelMain";
import { RepoPanelNotice } from "@/features/home/components/repo/RepoPanelNotice";
import { RepoPanelOffline } from "@/features/home/components/repo/RepoPanelOffline";
import { RepoPanelToolbar } from "@/features/home/components/repo/RepoPanelToolbar";
import {
  REPO_MOTION_CLASS,
  REPO_SLIDE_IN,
  REPO_SLIDE_OUT,
} from "@/features/home/animations";
import { useRepoSession } from "@/features/home/context";
import { useGithubConnection } from "@/features/github/hooks/useGithubConnection";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { repoFooterLabel } from "@/features/home/model/repoFooterLabel";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
import type { RepoTab } from "@/features/home/model/repoTab";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type RepoPanelFilesDrawerProps = {
  visible: boolean;
  idPrefix: string;
  tabId: (value: RepoTab) => string;
  panelId: string;
  tabRefs: MutableRefObject<Partial<Record<RepoTab, HTMLButtonElement>>>;
  onTabKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onDismiss: () => void;
};

/** Tiroir 1 — arbre / commits / états (mock) ou connexion live. */
export function RepoPanelFilesDrawer({
  visible,
  idPrefix,
  tabId,
  panelId,
  tabRefs,
  onTabKeyDown,
  onDismiss,
}: RepoPanelFilesDrawerProps) {
  const session = useRepoSession();
  const github = useGithubConnection();
  const live = github.status !== "unavailable";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 flex w-[min(22rem,28%)] flex-col border-r border-line-subtle bg-bg isolate transition-transform",
        REPO_MOTION_CLASS,
        REPO_LAYER_CLASS.panel,
        visible ? REPO_SLIDE_IN : REPO_SLIDE_OUT,
      )}
      aria-label={t("home.repoPanelLabel")}
      aria-hidden={!visible || undefined}
      inert={!visible ? true : undefined}
    >
      <div className="relative flex h-full min-h-0 flex-col">
        <header className={cn(REPO_CHROME.header, "justify-between")}>
          <p className="t-mono text-sm tracking-wide text-text-muted uppercase">
            {t("home.repoTitle")}
          </p>
          <Button
            variant="ghost"
            size="bare"
            className={REPO_CHROME.closeButton}
            aria-label={t("home.repoCloseLabel")}
            onClick={onDismiss}
          >
            {t("home.repoClose")}
          </Button>
        </header>

        {/* Scénarios mock : uniquement hors Supabase (dev UI). */}
        {!live ? <RepoPanelToolbar idPrefix={idPrefix} /> : null}

        {!live && session.scenario === "nominal" && session.repo ? (
          <div className="shrink-0 pt-3">
            <RepoPanelNotice />
          </div>
        ) : null}

        {!live && session.scenario === "offline" ? (
          <div className="shrink-0 pt-3">
            <RepoPanelOffline />
          </div>
        ) : null}

        <RepoPanelMain
          tabId={tabId}
          panelId={panelId}
          tabRefs={tabRefs}
          onTabKeyDown={onTabKeyDown}
        />

        <footer className={REPO_CHROME.footer}>
          <p className={REPO_CHROME.footerText}>
            {live
              ? t("home.repoFooterGithub")
              : repoFooterLabel(session.scenario)}
          </p>
        </footer>
      </div>
    </aside>
  );
}
