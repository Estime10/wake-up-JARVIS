"use client";

import type { KeyboardEvent, MutableRefObject } from "react";

import { Button } from "@/components/ui/Button";
import {
  RepoCommitIcon,
  RepoFolderIcon,
  RepoPrIcon,
} from "@/features/home/components/repo/icons";
import { RepoPanelDenied } from "@/features/home/components/repo/RepoPanelDenied";
import { RepoPanelDisconnected } from "@/features/home/components/repo/RepoPanelDisconnected";
import { RepoPanelEmptyRepos } from "@/features/home/components/repo/RepoPanelEmptyRepos";
import { RepoPanelError } from "@/features/home/components/repo/RepoPanelError";
import { RepoPanelLoading } from "@/features/home/components/repo/RepoPanelLoading";
import { RepoTabContent } from "@/features/home/components/repo/RepoTabContent";
import { useRepoSession } from "@/features/home/context";
import { REPO_TAB_LABEL_KEY } from "@/features/home/model/repoTabsUi";
import { REPO_TABS, type RepoTab } from "@/features/home/model/repoTab";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

const TAB_ICON = {
  files: RepoFolderIcon,
  commits: RepoCommitIcon,
  pr: RepoPrIcon,
} as const;

type RepoPanelMainProps = {
  tabId: (value: RepoTab) => string;
  panelId: string;
  tabRefs: MutableRefObject<Partial<Record<RepoTab, HTMLButtonElement>>>;
  onTabKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
};

/** Corps du tiroir fichiers — états scénario ou onglets. */
export function RepoPanelMain({
  tabId,
  panelId,
  tabRefs,
  onTabKeyDown,
}: RepoPanelMainProps) {
  const session = useRepoSession();

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
        "flex min-h-0 flex-1 flex-col",
        session.scenario === "offline" && "opacity-80",
      )}
    >
      <div
        role="tablist"
        aria-label={t("home.repoTabsLabel")}
        className="flex shrink-0 gap-5 border-b border-line-subtle px-4 pt-3"
        onKeyDown={onTabKeyDown}
      >
        {REPO_TABS.map((value) => {
          const Icon = TAB_ICON[value];
          return (
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
              <Icon className="size-3.5" />
              {t(REPO_TAB_LABEL_KEY[value])}
            </Button>
          );
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(session.tab)}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
        <RepoTabContent />
      </div>
    </div>
  );
}
