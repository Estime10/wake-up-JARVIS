"use client";

import { MailPreview } from "@/features/home/components/mail/MailPreview";
import {
  REPO_MOTION_CLASS,
  REPO_SLIDE_IN,
  REPO_SLIDE_OUT,
} from "@/features/home/animations";
import { HOME_LEFT_HALF_INSET_CLASS } from "@/features/home/model/homeColumnLayout";
import { REPO_LAYER_CLASS } from "@/features/home/model/repoLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import type { MailSummary } from "@/lib/schemas";

type MailPreviewDrawerProps = {
  visible: boolean;
  mail: MailSummary;
  onClose: () => void;
};

/**
 * Tiroir 2 — 2e moitié section gauche.
 * Clip overflow pour ne pas peindre sur la liste pendant le slide.
 */
export function MailPreviewDrawer({
  visible,
  mail,
  onClose,
}: MailPreviewDrawerProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-y-0 overflow-hidden",
        HOME_LEFT_HALF_INSET_CLASS,
        REPO_LAYER_CLASS.preview,
      )}
      data-scroll-lock-allow="true"
    >
      <aside
        className={cn(
          "absolute inset-0 flex flex-col border-r border-line-subtle bg-bg isolate transition-transform",
          REPO_MOTION_CLASS,
          visible
            ? `pointer-events-auto ${REPO_SLIDE_IN}`
            : `pointer-events-none ${REPO_SLIDE_OUT}`,
        )}
        aria-label={t("home.mailPreviewLabel", {
          subject: mail.subject || t("home.mailNoSubject"),
        })}
        aria-hidden={!visible || undefined}
        inert={!visible ? true : undefined}
      >
        <MailPreview mail={mail} onClose={onClose} />
      </aside>
    </div>
  );
}
