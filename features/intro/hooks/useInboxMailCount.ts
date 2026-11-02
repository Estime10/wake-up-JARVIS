"use client";

import { useMailFeed } from "@/features/mail/MailFeedProvider";
import { snapshotInboxMailCount } from "@/features/intro/model/snapshotInboxMailCount";

/**
 * Total mails HUD — même source que le panneau (pas de 2ᵉ fetch).
 */
export function useInboxMailCount(): number {
  const { mails, status } = useMailFeed();
  if (status === "ready") {
    return mails.length;
  }
  return snapshotInboxMailCount();
}
