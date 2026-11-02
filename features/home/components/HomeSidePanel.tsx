"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { MailListItem } from "@/features/home/components/MailListItem";
import { MailListSkeleton } from "@/features/home/components/MailListSkeleton";
import { SidePanelMessage } from "@/features/home/components/SidePanelMessage";
import { useRecentMails } from "@/features/home/hooks/useRecentMails";
import { nextTabIndex } from "@/features/home/model/tabKeyboard";
import { MailAccountsBar } from "@/features/mail/components/MailAccountsBar";
import { useMailAccounts } from "@/features/mail/hooks/useMailAccounts";
import { MOCK_MAIL_ACCOUNTS } from "@/fixtures/mailAccounts";
import { t } from "@/lib/i18n";
import type { MailAccount } from "@/lib/schemas";

const OAUTH_FLASH = {
  ok: "home.mailOAuthOk",
  denied: "home.mailOAuthDenied",
  limit: "home.mailOAuthLimit",
  error: "home.mailOAuthError",
  store: "home.mailOAuthStore",
  state: "home.mailOAuthState",
  no_refresh: "home.mailOAuthNoRefresh",
  scope: "home.mailOAuthScope",
  config: "home.mailOAuthConfig",
} as const;

/**
 * Panneau droit — boîtes Gmail (OAuth étape 1) + onglets libellés courts.
 * Contenu mails : mock tant que la relève (étape 2) n’existe pas.
 */
export function HomeSidePanel() {
  const searchParams = useSearchParams();
  const {
    accounts: linkedAccounts,
    status: accountsStatus,
    refresh: refreshAccounts,
    setEnabled,
    disconnect,
  } = useMailAccounts();
  const { mails, status: mailStatus, retry: retryMails } = useRecentMails();
  const idPrefix = useId();
  const tabRefs = useRef<Partial<Record<string, HTMLButtonElement>>>({});
  const [accountId, setAccountId] = useState<string | null>(null);
  const oauthHandled = useRef<string | null>(null);

  const useLiveAccounts =
    accountsStatus === "ready" || accountsStatus === "error";
  const accounts: readonly MailAccount[] = useLiveAccounts
    ? linkedAccounts
    : MOCK_MAIL_ACCOUNTS;

  const selectedAccountId = useMemo(() => {
    if (accounts.length === 0) {
      return "";
    }
    if (accountId && accounts.some((account) => account.id === accountId)) {
      return accountId;
    }
    return accounts[0]?.id ?? "";
  }, [accounts, accountId]);

  const oauthResult = searchParams.get("mail_oauth");
  const flashMessage =
    oauthResult && oauthResult in OAUTH_FLASH
      ? t(OAUTH_FLASH[oauthResult as keyof typeof OAUTH_FLASH])
      : null;

  useEffect(() => {
    if (!oauthResult || oauthHandled.current === oauthResult) {
      return;
    }
    oauthHandled.current = oauthResult;
    refreshAccounts();
  }, [oauthResult, refreshAccounts]);

  const countsByAccount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const account of accounts) {
      counts.set(account.id, 0);
    }
    if (useLiveAccounts || mailStatus !== "ready") {
      return counts;
    }
    for (const mail of mails) {
      counts.set(mail.accountId, (counts.get(mail.accountId) ?? 0) + 1);
    }
    return counts;
  }, [accounts, mailStatus, mails, useLiveAccounts]);

  const activeMails = useMemo(() => {
    if (useLiveAccounts) {
      return [];
    }
    return mails.filter((mail) => mail.accountId === selectedAccountId);
  }, [mails, selectedAccountId, useLiveAccounts]);

  const entryCount = countsByAccount.get(selectedAccountId) ?? 0;
  const tabId = (id: string) => `${idPrefix}-tab-${id}`;
  const panelId = `${idPrefix}-panel`;
  const canConnect =
    useLiveAccounts && linkedAccounts.length < 3 && accountsStatus === "ready";

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = accounts.findIndex(
      (account) => account.id === selectedAccountId,
    );
    const next = nextTabIndex(event.key, currentIndex, accounts.length);
    const nextAccount = next === null ? undefined : accounts[next];
    if (!nextAccount) {
      return;
    }
    event.preventDefault();
    setAccountId(nextAccount.id);
    tabRefs.current[nextAccount.id]?.focus();
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col border-l border-line-subtle">
      {useLiveAccounts ? (
        <MailAccountsBar
          accounts={linkedAccounts}
          canConnect={canConnect}
          onToggle={(id, enabled) => {
            void setEnabled(id, enabled);
          }}
          onDisconnect={(id) => {
            void disconnect(id);
          }}
        />
      ) : null}

      {flashMessage ? (
        <p
          className="border-b border-line-subtle px-4 py-2 text-sm text-accent"
          role="status"
        >
          {flashMessage}
        </p>
      ) : null}

      {accounts.length > 0 ? (
        <div
          role="tablist"
          aria-label={t("home.sideTabsLabel")}
          className="flex shrink-0 justify-between gap-2 border-b border-line-subtle px-3 pt-4 sm:gap-3 sm:px-4"
          onKeyDown={handleTabKeyDown}
        >
          {accounts.map((account) => {
            const count = countsByAccount.get(account.id) ?? 0;
            const selected = account.id === selectedAccountId;
            return (
              <Button
                key={account.id}
                ref={(node) => {
                  if (node) {
                    tabRefs.current[account.id] = node;
                  } else {
                    delete tabRefs.current[account.id];
                  }
                }}
                id={tabId(account.id)}
                variant="tab"
                size="tab"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                aria-label={t("home.mailboxTabA11y", {
                  label: account.label,
                  count: String(count),
                })}
                tabIndex={selected ? 0 : -1}
                onClick={() => setAccountId(account.id)}
                className="min-w-0 flex-1 justify-center text-sm font-medium normal-case tracking-normal"
              >
                <span
                  className="inline-flex max-w-full items-baseline gap-1.5 text-sm"
                  aria-hidden
                >
                  <span className="truncate">{account.label}</span>
                  <span className="shrink-0 font-mono text-sm font-normal tabular-nums text-text-muted">
                    {count}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      ) : null}

      <div className="flex shrink-0 items-center px-4 py-3">
        <p className="flex min-h-touch items-center text-sm text-text-muted">
          {t("home.entriesCount", { count: entryCount })}
        </p>
      </div>

      <div
        id={panelId}
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
        role="tabpanel"
        aria-labelledby={
          selectedAccountId ? tabId(selectedAccountId) : undefined
        }
        tabIndex={0}
      >
        {useLiveAccounts && linkedAccounts.length === 0 ? (
          <SidePanelMessage text={t("home.mailConnectFirst")} />
        ) : useLiveAccounts ? (
          <SidePanelMessage text={t("home.mailEmpty")} />
        ) : mailStatus === "loading" ? (
          <MailListSkeleton />
        ) : mailStatus === "error" ? (
          <SidePanelMessage
            text={t("home.mailError")}
            tone="danger"
            actionLabel={t("home.mailRetry")}
            onAction={retryMails}
          />
        ) : activeMails.length === 0 ? (
          <SidePanelMessage text={t("home.mailEmpty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {activeMails.map((mail) => (
              <li key={mail.id}>
                <MailListItem mail={mail} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
