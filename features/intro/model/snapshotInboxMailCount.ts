import { MAIL_INBOX_TOTAL_AT_OPEN } from "@/fixtures/mailInboxTotal";

/**
 * Snapshot du total mails à l'ouverture (domaine pur).
 * Aujourd'hui : fixture mock ; demain : lecture via MailPort à l'instant T.
 */
export function snapshotInboxMailCount(): number {
  return MAIL_INBOX_TOTAL_AT_OPEN;
}
