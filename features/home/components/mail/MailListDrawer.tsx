"use client";

import { Suspense } from "react";

import { Button } from "@/components/ui/Button";
import {
  REPO_MOTION_CLASS,
  REPO_SLIDE_IN,
  REPO_SLIDE_OUT,
} from "@/features/home/animations";
import { HomeSidePanel } from "@/features/home/components/HomeSidePanel";
import { HOME_LEFT_HALF_WIDTH_CLASS } from "@/features/home/model/homeColumnLayout";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type MailListDrawerProps = {
  visible: boolean;
  onDismiss: () => void;
};

/** Tiroir 1 — liste / boîtes (1re moitié section gauche). */
export function MailListDrawer({ visible, onDismiss }: MailListDrawerProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 flex flex-col border-r border-line-subtle bg-bg isolate transition-transform",
        HOME_LEFT_HALF_WIDTH_CLASS,
        REPO_MOTION_CLASS,
        REPO_LAYER_CLASS.panel,
        visible ? REPO_SLIDE_IN : REPO_SLIDE_OUT,
      )}
      data-scroll-lock-allow="true"
      aria-label={t("home.mailPanelLabel")}
      aria-hidden={!visible || undefined}
      inert={!visible ? true : undefined}
    >
      <header className={cn(REPO_CHROME.header, "justify-between")}>
        <p className="t-mono text-sm tracking-wide text-text uppercase">
          {t("home.email")}
        </p>
        <Button
          variant="ghost"
          size="bare"
          className={REPO_CHROME.closeButton}
          aria-label={t("home.mailCloseLabel")}
          onClick={onDismiss}
        >
          {t("home.mailClose")}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={null}>
          <HomeSidePanel />
        </Suspense>
      </div>
    </aside>
  );
}
