"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/Button";
import { MailListItem } from "@/features/home/components/MailListItem";
import { useRecentMails } from "@/features/home/hooks/useRecentMails";
import { nextTabIndex } from "@/features/home/model/tabKeyboard";
import { t } from "@/lib/i18n";

const SIDE_TABS = ["journal", "mails"] as const;
type SideTab = (typeof SIDE_TABS)[number];

const TAB_LABEL_KEY = {
  journal: "home.tabJournal",
  mails: "home.tabMails",
} as const;

/** Panneau droit — fond global + blur, onglets centrés (pattern ARIA Tabs). */
export function HomeSidePanel() {
  const [tab, setTab] = useState<SideTab>("mails");
  const { mails, loading } = useRecentMails();
  const idPrefix = useId();
  const tabRefs = useRef<Partial<Record<SideTab, HTMLButtonElement>>>({});
  const entryCount = tab === "mails" ? mails.length : 0;
  const tabId = (value: SideTab) => `${idPrefix}-tab-${value}`;
  const panelId = `${idPrefix}-panel`;

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = nextTabIndex(
      event.key,
      SIDE_TABS.indexOf(tab),
      SIDE_TABS.length,
    );
    const nextTab = next === null ? undefined : SIDE_TABS[next];
    if (!nextTab) {
      return;
    }
    event.preventDefault();
    setTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-bg">
      <div
        className="pointer-events-none absolute inset-0 bg-surface/25 backdrop-blur-2xl"
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col border-l border-line-subtle">
        <div
          role="tablist"
          aria-label={t("home.sideTabsLabel")}
          className="flex shrink-0 justify-center gap-6 border-b border-line-subtle px-4 pt-4"
          onKeyDown={handleTabKeyDown}
        >
          {SIDE_TABS.map((value) => (
            <Button
              key={value}
              ref={(node) => {
                if (node) {
                  tabRefs.current[value] = node;
                } else {
                  delete tabRefs.current[value];
                }
              }}
              id={tabId(value)}
              variant="tab"
              size="tab"
              role="tab"
              aria-selected={tab === value}
              aria-controls={panelId}
              tabIndex={tab === value ? 0 : -1}
              onClick={() => setTab(value)}
            >
              {t(TAB_LABEL_KEY[value])}
            </Button>
          ))}
        </div>

        {/* Filtre retiré tant qu'aucun lot ne le branche (arrêt de tab inerte).
            `min-h-touch` garde la hauteur de la rangée. */}
        <div className="flex shrink-0 items-center px-4 py-3">
          <p className="t-label flex min-h-touch items-center text-sm text-text-muted">
            {t("home.entriesCount", { count: entryCount })}
          </p>
        </div>

        <div
          id={panelId}
          className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
          role="tabpanel"
          aria-labelledby={tabId(tab)}
          tabIndex={0}
        >
          {tab === "mails" ? (
            loading ? (
              <p className="t-mono px-1 text-sm text-text-muted">
                {t("home.mailLoading")}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {mails.map((mail) => (
                  <li key={mail.id}>
                    <MailListItem mail={mail} />
                  </li>
                ))}
              </ul>
            )
          ) : (
            <p className="t-mono px-1 text-sm text-text-muted">
              {t("home.journalEmpty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
