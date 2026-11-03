"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { usePorts } from "@/app/ports-context";
import {
  isMailPollStale,
  MAIL_POLL_INTERVAL_MS,
  runMailPoll,
} from "@/features/mail/model/mailPollSchedule";
import type { MailSummary } from "@/lib/schemas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

const DEFAULT_LIMIT = 500;

export type MailListStatus = "loading" | "ready" | "error";

type MailFeedValue = {
  mails: MailSummary[];
  status: MailListStatus;
  /** Recharge depuis Supabase (sans appeler Gmail). */
  refreshFromDb: () => void;
};

const MailFeedContext = createContext<MailFeedValue | null>(null);

/**
 * Source unique mails UI — 1 fetch DB + Realtime `mail_items`.
 * Relève Gmail automatique toutes les 10 min (onglet visible).
 */
export function MailFeedProvider({ children }: { children: ReactNode }) {
  const { mail } = usePorts();
  const [mails, setMails] = useState<MailSummary[]>([]);
  const [status, setStatus] = useState<MailListStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void mail
      .listRecent(DEFAULT_LIMIT)
      .then((list) => {
        if (cancelled) {
          return;
        }
        // UI = reçus uniquement (SENT réservés à l’agent).
        setMails(list.filter((item) => item.isSent !== true));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setMails([]);
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mail, attempt]);

  useEffect(() => {
    if (!hasSupabasePublicEnv()) {
      return;
    }

    const client = createSupabaseBrowserClient();
    const channel = client
      .channel("mail_items_feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mail_items" },
        () => {
          setAttempt((value) => value + 1);
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!hasSupabasePublicEnv()) {
      return;
    }

    let cancelled = false;

    const tick = () => {
      if (cancelled || document.visibilityState !== "visible") {
        return;
      }
      if (!isMailPollStale()) {
        return;
      }
      void runMailPoll().then((ok) => {
        if (ok && !cancelled) {
          setAttempt((value) => value + 1);
        }
      });
    };

    tick();
    const id = window.setInterval(tick, MAIL_POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const refreshFromDb = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo<MailFeedValue>(
    () => ({ mails, status, refreshFromDb }),
    [mails, status, refreshFromDb],
  );

  return (
    <MailFeedContext.Provider value={value}>
      {children}
    </MailFeedContext.Provider>
  );
}

export function useMailFeed(): MailFeedValue {
  const ctx = useContext(MailFeedContext);
  if (!ctx) {
    throw new Error("useMailFeed hors MailFeedProvider");
  }
  return ctx;
}
