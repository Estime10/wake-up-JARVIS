"use client";

import { Button } from "@/components/ui/Button";
import { resolveMailLabelColor } from "@/features/mail/model/mailLabelColors";
import { REPO_CHROME } from "@/features/home/model/repoChrome";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
import type { MailSummary } from "@/lib/schemas";

type MailPreviewProps = {
  mail: MailSummary;
  onClose: () => void;
};

/** Corps du 2ᵉ tiroir — détail mail (texte seul, jamais de HTML). */
export function MailPreview({ mail, onClose }: MailPreviewProps) {
  const labelText = mail.category?.trim() || mail.flagReason?.trim() || null;
  const labelColor = resolveMailLabelColor(
    mail.category ?? mail.flagReason ?? undefined,
  );
  const body = mail.excerpt.trim();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className={cn(REPO_CHROME.header, "justify-between gap-3")}>
        <p className="t-mono min-w-0 truncate text-sm text-text">
          {mail.subject || t("home.mailNoSubject")}
        </p>
        <Button
          variant="ghost"
          size="bare"
          className={REPO_CHROME.closeButton}
          aria-label={t("home.mailPreviewCloseLabel")}
          onClick={onClose}
        >
          {t("home.mailClose")}
        </Button>
      </header>

      <div className="flex shrink-0 flex-col gap-1 border-b border-line-subtle px-4 py-3">
        <p className="t-mono truncate text-sm text-text">{mail.from}</p>
        <p className="t-mono text-dial text-text-muted sm:text-sm">
          {mail.time}
          {labelText ? (
            <>
              {" · "}
              <span
                className={cn("uppercase", !labelColor && "text-text-muted")}
                style={labelColor ? { color: labelColor } : undefined}
              >
                {labelText}
              </span>
            </>
          ) : null}
        </p>
      </div>

      <div
        data-scroll-lock-allow="true"
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4"
      >
        <p className="t-mono whitespace-pre-wrap text-sm leading-relaxed text-text">
          {body || t("home.mailExcerptPending")}
        </p>
      </div>
    </div>
  );
}
