"use client";

import { MailPreview } from "@/features/home/components/ui/mail/MailPreview";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";
import type { MailSummary } from "@/lib/schemas";

type MailPreviewDrawerProps = {
  visible: boolean;
  mail: MailSummary;
  onClose: () => void;
};

/**
 * Aperçu mail — couvre la liste dans le même liquid-glass.
 */
export function MailPreviewDrawer({
  visible,
  mail,
  onClose,
}: MailPreviewDrawerProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col",
        HUD_OVERLAY_MOTION_CLASS,
        visible
          ? "pointer-events-auto opacity-100"
          : "pointer-events-none opacity-0",
      )}
      data-scroll-lock-allow="true"
      aria-label={t("home.mailPreviewLabel", {
        subject: mail.subject || t("home.mailNoSubject"),
      })}
      aria-hidden={!visible || undefined}
      inert={!visible ? true : undefined}
    >
      <MailPreview mail={mail} onClose={onClose} />
    </div>
  );
}
