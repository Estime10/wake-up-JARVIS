"use client";

import { useCallback, useEffect, useState } from "react";

import { usePorts } from "@/app/ports-context";
import type { MailSummary } from "@/lib/schemas";

const DEFAULT_LIMIT = 50;

export type MailListStatus = "loading" | "ready" | "error";

type UseRecentMailsResult = {
  mails: MailSummary[];
  status: MailListStatus;
  retry: () => void;
};

type MailSnapshot =
  | { status: "loading" }
  | { status: "ready"; limit: number; mails: MailSummary[] }
  | { status: "error"; limit: number };

/** Charge les mails via MailPort — loading / ready / error (empty = ready []). */
export function useRecentMails(
  limit: number = DEFAULT_LIMIT,
): UseRecentMailsResult {
  const { mail } = usePorts();
  const [snapshot, setSnapshot] = useState<MailSnapshot>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void mail
      .listRecent(limit)
      .then((list) => {
        if (!cancelled) {
          setSnapshot({ status: "ready", limit, mails: list });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshot({ status: "error", limit });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mail, limit, attempt]);

  const retry = useCallback(() => {
    setSnapshot({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  if (snapshot.status === "ready" && snapshot.limit === limit) {
    return { mails: snapshot.mails, status: "ready", retry };
  }

  if (snapshot.status === "error" && snapshot.limit === limit) {
    return { mails: [], status: "error", retry };
  }

  return { mails: [], status: "loading", retry };
}
