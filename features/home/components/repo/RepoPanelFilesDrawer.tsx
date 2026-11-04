"use client";

import { Button } from "@/components/ui/Button";
import { RepoPanelMain } from "@/features/home/components/repo/RepoPanelMain";
import {
  REPO_MOTION_CLASS,
  REPO_SLIDE_IN,
  REPO_SLIDE_OUT,
} from "@/features/home/animations";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { REPO_FILES_DRAWER_WIDTH_CLASS } from "@/features/home/model/repoDrawerLayout";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type RepoPanelFilesDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
};

/** Tiroir 1 — connexion / lecture GitHub live. */
export function RepoPanelFilesDrawer({
  visible,
  onDismiss,
}: RepoPanelFilesDrawerProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 flex flex-col border-r border-line-subtle bg-bg isolate transition-transform",
        REPO_FILES_DRAWER_WIDTH_CLASS,
        REPO_MOTION_CLASS,
        REPO_LAYER_CLASS.panel,
        visible ? REPO_SLIDE_IN : REPO_SLIDE_OUT,
      )}
      data-scroll-lock-allow="true"
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

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <RepoPanelMain />
        </div>

        <footer className={REPO_CHROME.footer}>
          <p className={REPO_CHROME.footerText}>{t("home.repoFooterGithub")}</p>
        </footer>
      </div>
    </aside>
  );
}
