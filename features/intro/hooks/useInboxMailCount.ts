"use client";

import { useMailFeed } from "@/features/mail/MailFeedProvider";

/**
 * Total mails HUD — même source que le panneau (pas de 2ᵉ fetch).
 * 0 tant que le feed n’est pas prêt (plus de snapshot fixture).
 */
export function useInboxMailCount(): number {
  const { mails, status } = useMailFeed();
  if (status === "ready") {
    return mails.length;
  }
  return 0;
}
