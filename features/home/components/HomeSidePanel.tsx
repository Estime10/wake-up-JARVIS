"use client";

import { useState } from "react";

import { MailListItem } from "@/features/home/components/MailListItem";
import { MOCK_MAILS } from "@/fixtures/mails";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type SideTab = "journal" | "mails";

/** Panneau droit — fond global + blur, onglets centrés. */
export function HomeSidePanel() {
  const [tab, setTab] = useState<SideTab>("mails");
  const entryCount = tab === "mails" ? MOCK_MAILS.length : 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-bg">
      <div
        className="pointer-events-none absolute inset-0 bg-surface/25 backdrop-blur-2xl"
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col border-l border-white/10">
        <div
          role="tablist"
          aria-label={t("home.sideTabsLabel")}
          className="flex shrink-0 justify-center gap-6 border-b border-white/10 px-4 pt-4"
        >
          <SideTabButton
            selected={tab === "journal"}
            onSelect={() => setTab("journal")}
          >
            {t("home.tabJournal")}
          </SideTabButton>
          <SideTabButton
            selected={tab === "mails"}
            onSelect={() => setTab("mails")}
          >
            {t("home.tabMails")}
          </SideTabButton>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-3">
          <p className="t-label text-xs text-text-muted">
            {t("home.entriesCount", { count: entryCount })}
          </p>
          <button
            type="button"
            className="t-label inline-flex min-h-touch items-center gap-1.5 rounded-md px-2 text-xs text-text-muted hover:text-text"
          >
            <FilterIcon />
            {t("home.filterAll")}
          </button>
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
          role="tabpanel"
        >
          {tab === "mails" ? (
            <ul className="flex flex-col gap-2">
              {MOCK_MAILS.map((mail) => (
                <li key={mail.id}>
                  <MailListItem mail={mail} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-mono px-1 text-xs text-text-muted">
              {t("home.journalEmpty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SideTabButton({
  selected,
  onSelect,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "t-label border-b-2 pb-3 text-sm transition-colors",
        selected
          ? "border-accent text-accent"
          : "border-transparent text-text-muted hover:text-text",
      )}
    >
      {children}
    </button>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path d="M2.5 3.5h11L9.5 8.2v3.3L6.5 13V8.2L2.5 3.5Z" />
    </svg>
  );
}
