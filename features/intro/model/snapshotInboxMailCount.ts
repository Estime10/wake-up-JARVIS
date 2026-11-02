import { MAIL_INBOX_TOTAL_AT_OPEN } from "@/fixtures/mails";

/**
 * Snapshot fixture — fallback splash / loading HUD.
 * Le total live passe par `useInboxMailCount` → MailPort.
 */
export function snapshotInboxMailCount(): number {
  return MAIL_INBOX_TOTAL_AT_OPEN;
}
