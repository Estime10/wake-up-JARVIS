"use client";

import { Button } from "@/components/ui/Button/Button";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";
import type { MailAccount } from "@/lib/schemas";
import { ROUTES } from "@/lib/routes";

type MailAccountsBarProps = {
  accounts: MailAccount[];
  canConnect: boolean;
  polling?: boolean;
  onRefresh?: () => void;
  onToggle: (accountId: string, enabled: boolean) => void;
  onDisconnect: (accountId: string) => void;
};

/** Rangée connexion Gmail — ajouter / activer / débrancher. */
export function MailAccountsBar({
  accounts,
  canConnect,
  polling = false,
  onRefresh,
  onToggle,
  onDisconnect,
}: MailAccountsBarProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-line-subtle px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="t-label text-text">{t("home.mailboxesTitle")}</p>
        <div className="flex items-center gap-3">
          {onRefresh && accounts.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="bare"
              disabled={polling}
              onClick={onRefresh}
              className="t-label text-text hover:text-accent"
            >
              {polling ? t("home.mailPolling") : t("home.mailRefresh")}
            </Button>
          ) : null}
          {canConnect ? (
            <a
              href={ROUTES.googleOAuthConnect}
              className="t-label text-text transition-colors hover:text-accent"
            >
              {t("home.mailAddMailbox")}
            </a>
          ) : null}
        </div>
      </div>

      {accounts.length === 0 ? (
        <p className="t-content text-base leading-snug">
          {t("home.mailNoMailbox")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {accounts.map((account) => {
            const enabled = account.status === "active";
            const needsReauth = account.status === "needs_reauth";
            return (
              <li
                key={account.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="t-content truncate leading-snug uppercase">
                    {account.label}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {needsReauth ? (
                    <a
                      href={ROUTES.googleOAuthConnect}
                      className="t-label text-attention transition-colors hover:text-accent"
                    >
                      {t("home.mailNeedsReauth")}
                    </a>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="bare"
                      className={cn(
                        "t-label",
                        enabled ? "text-success" : "text-text",
                      )}
                      onClick={() => onToggle(account.id, !enabled)}
                    >
                      {enabled
                        ? t("home.mailStatusActive")
                        : t("home.mailStatusDisabled")}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="bare"
                    className="t-label text-danger"
                    onClick={() => onDisconnect(account.id)}
                  >
                    {t("home.mailDisconnect")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
