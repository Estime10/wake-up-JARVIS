"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";
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
    <div className="flex shrink-0 flex-col gap-2 border-b border-line-subtle px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium tracking-wide text-text uppercase">
          {t("home.mailboxesTitle")}
        </p>
        <div className="flex items-center gap-3">
          {onRefresh && accounts.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="bare"
              disabled={polling}
              onClick={onRefresh}
              className="font-mono text-sm tracking-wide text-text uppercase hover:text-accent"
            >
              {polling ? t("home.mailPolling") : t("home.mailRefresh")}
            </Button>
          ) : null}
          {canConnect ? (
            <a
              href={ROUTES.googleOAuthConnect}
              className="font-mono text-sm tracking-wide text-text uppercase transition-colors hover:text-accent"
            >
              {t("home.mailAddMailbox")}
            </a>
          ) : null}
        </div>
      </div>

      {accounts.length === 0 ? (
        <p className="t-mono text-sm text-text">{t("home.mailNoMailbox")}</p>
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
                  <p className="truncate text-sm tracking-wide text-text uppercase">
                    {account.label}
                  </p>
                  {needsReauth ? (
                    <p className="text-sm tracking-wide text-attention uppercase">
                      {t("home.mailNeedsReauth")}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="bare"
                    className={cn(
                      "text-sm tracking-wide uppercase",
                      enabled ? "text-success" : "text-text",
                    )}
                    disabled={needsReauth}
                    onClick={() => onToggle(account.id, !enabled)}
                  >
                    {enabled
                      ? t("home.mailStatusActive")
                      : t("home.mailStatusDisabled")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="bare"
                    className="text-sm tracking-wide text-danger uppercase"
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
