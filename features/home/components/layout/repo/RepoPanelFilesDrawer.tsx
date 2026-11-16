"use client";

import { Button } from "@/components/ui/Button/Button";
import { RepoPanelMain } from "@/features/home/components/ui/repo/panel/RepoPanelMain";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";

type RepoPanelFilesDrawerProps = {
  onDismiss: () => void;
};

/** Liste repo — remplit le liquid-glass `side-left` (comme mail / terminal). */
export function RepoPanelFilesDrawer({ onDismiss }: RepoPanelFilesDrawerProps) {
  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col"
      data-scroll-lock-allow="true"
      aria-label={t("home.repoPanelLabel")}
    >
      <header className={cn(REPO_CHROME.header, "justify-between gap-3")}>
        <p className="t-label text-text">{t("home.repoTitle")}</p>
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
  );
}
