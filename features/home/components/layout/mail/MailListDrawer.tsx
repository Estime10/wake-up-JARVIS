"use client";

import { Suspense } from "react";

import { Button } from "@/components/ui/Button/Button";
import { MailPanelBody } from "@/features/mail/components/MailPanelBody";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";

type MailListDrawerProps = {
  onDismiss: () => void;
};

/** Liste mails — remplit le liquid-glass `side-left` (comme le terminal). */
export function MailListDrawer({ onDismiss }: MailListDrawerProps) {
  return (
    <div
      className="relative flex h-full min-h-0 w-full flex-col"
      data-scroll-lock-allow="true"
      aria-label={t("home.mailPanelLabel")}
    >
      <header className={cn(REPO_CHROME.header, "justify-between gap-3")}>
        <p className="t-label text-text">{t("home.email")}</p>
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
          <MailPanelBody />
        </Suspense>
      </div>
    </div>
  );
}
