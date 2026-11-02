"use client";

import { useEffect, useState } from "react";

import { usePorts } from "@/app/ports-context";
import type { MailSummary } from "@/lib/schemas";

const DEFAULT_LIMIT = 50;

type UseRecentMailsResult = {
  mails: MailSummary[];
  loading: boolean;
};

type MailSnapshot = {
  limit: number;
  mails: MailSummary[];
};

/** Charge les mails via MailPort (lecture seule). */
export function useRecentMails(
  limit: number = DEFAULT_LIMIT,
): UseRecentMailsResult {
  const { mail } = usePorts();
  const [snapshot, setSnapshot] = useState<MailSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void mail.listRecent(limit).then((list) => {
      if (!cancelled) {
        setSnapshot({ limit, mails: list });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mail, limit]);

  const ready = snapshot !== null && snapshot.limit === limit;
  return {
    mails: ready ? snapshot.mails : [],
    loading: !ready,
  };
}
