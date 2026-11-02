"use client";

import { useMailFeed } from "@/features/mail/MailFeedProvider";
import type { MailSummary } from "@/lib/schemas";

export type MailListStatus = "loading" | "ready" | "error";

type UseRecentMailsResult = {
  mails: MailSummary[];
  status: MailListStatus;
  retry: () => void;
};

/**
 * Liste mails — lit le feed partagé (1 fetch + Realtime), pas un select par composant.
 */
export function useRecentMails(): UseRecentMailsResult {
  const { mails, status, refreshFromDb } = useMailFeed();
  return { mails, status, retry: refreshFromDb };
}
