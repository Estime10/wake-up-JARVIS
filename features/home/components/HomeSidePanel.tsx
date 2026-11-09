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
import { useMailPreview } from "@/features/mail/context/mailPreviewContext";
import { useMailAccounts } from "@/features/mail/hooks/useMailAccounts";
import { runMailPoll } from "@/features/mail/model/mailPollSchedule";
import { t } from "@/lib/i18n";

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
 * Corps tiroir mails — boîtes Gmail + mails relevés (live).
 * Shell / ouverture : `HomeMailDrawer` (section gauche).
 */
export function HomeSidePanel() {
  const searchParams = useSearchParams();
  const {
    accounts,
    status: accountsStatus,
    refresh: refreshAccounts,
    setEnabled,
    disconnect,
  } = useMailAccounts();
  const { mails, status: mailStatus, retry: retryMails } = useRecentMails();
  const { selected, select, clear } = useMailPreview();
  const idPrefix = useId();
  const tabRefs = useRef<Partial<Record<string, HTMLButtonElement>>>({});
  const [accountId, setAccountId] = useState<string | null>(null);
  const oauthHandled = useRef<string | null>(null);
  const [polling, setPolling] = useState(false);

  const live = accountsStatus !== "unavailable";

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
    if (mailStatus !== "ready") {
      return counts;
    }
    for (const mail of mails) {
      counts.set(mail.accountId, (counts.get(mail.accountId) ?? 0) + 1);
    }
    return counts;
  }, [accounts, mailStatus, mails]);

  const activeMails = useMemo(
    () =>
      mails.filter(
        (mail) => mail.accountId === selectedAccountId && mail.isSent !== true,
      ),
    [mails, selectedAccountId],
  );

  useEffect(() => {
    if (!selected) {
      return;
    }
    if (selected.accountId !== selectedAccountId) {
      clear();
      return;
    }
    if (!activeMails.some((mail) => mail.id === selected.id)) {
      clear();
    }
  }, [activeMails, clear, selected, selectedAccountId]);

  const tabId = (id: string) => `${idPrefix}-tab-${id}`;
  const panelId = `${idPrefix}-panel`;
  const canConnect = live && accounts.length < 3 && accountsStatus === "ready";

  const handleRefresh = () => {
    if (!live) {
      return;
    }
    setPolling(true);
    void runMailPoll()
      .then((ok) => {
        if (!ok) {
          return;
        }
        refreshAccounts();
        retryMails();
      })
      .finally(() => {
        setPolling(false);
      });
  };

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
    <div className="relative flex h-full min-h-0 flex-col">
      {live ? (
        <MailAccountsBar
          accounts={accounts}
          canConnect={canConnect}
          polling={polling}
          onRefresh={handleRefresh}
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
                className="min-w-0 flex-1 justify-center text-sm font-medium tracking-wide uppercase"
              >
                <span
                  className="inline-flex max-w-full items-baseline gap-1.5 text-sm"
                  aria-hidden
                >
                  <span className="truncate uppercase">{account.label}</span>
                  <span className="shrink-0 font-mono text-sm font-normal tracking-normal tabular-nums text-text normal-case">
                    {count}
                  </span>
                </span>
              </Button>
            );
          })}
        </div>
      ) : null}

      <div
        id={panelId}
        data-scroll-lock-allow="true"
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pt-3 pb-4"
        role="tabpanel"
        aria-labelledby={
          selectedAccountId ? tabId(selectedAccountId) : undefined
        }
        tabIndex={0}
      >
        {!live ? (
          <SidePanelMessage text={t("home.mailUnavailable")} />
        ) : accountsStatus === "loading" && accounts.length === 0 ? (
          <MailListSkeleton />
        ) : accountsStatus === "error" && accounts.length === 0 ? (
          <SidePanelMessage
            text={t("home.mailError")}
            tone="danger"
            actionLabel={t("home.mailRetry")}
            onAction={() => {
              refreshAccounts();
              retryMails();
            }}
          />
        ) : accounts.length === 0 ? (
          <SidePanelMessage text={t("home.mailConnectFirst")} />
        ) : mailStatus === "loading" || polling ? (
          <MailListSkeleton />
        ) : mailStatus === "error" ? (
          <SidePanelMessage
            text={t("home.mailError")}
            tone="danger"
            actionLabel={t("home.mailRetry")}
            onAction={handleRefresh}
          />
        ) : activeMails.length === 0 ? (
          <SidePanelMessage text={t("home.mailEmpty")} />
        ) : (
          <ul className="flex flex-col gap-2">
            {activeMails.map((mail) => (
              <li key={mail.id}>
                <MailListItem
                  mail={mail}
                  selected={selected?.id === mail.id}
                  onSelect={select}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
