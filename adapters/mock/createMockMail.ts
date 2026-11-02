import { MOCK_MAILS } from "@/fixtures/mails";
import { mailSummarySchema, type MailSummary } from "@/lib/schemas";
import type { MailPort } from "@/ports/mail-port";

/** Mock mails — lecture seule depuis fixtures validées. */
export function createMockMail(): MailPort {
  const mails: MailSummary[] = MOCK_MAILS.map((m) =>
    mailSummarySchema.parse(m),
  );

  return {
    async listRecent(limit) {
      const safeLimit = Number.isFinite(limit)
        ? Math.max(0, Math.floor(limit))
        : 0;
      return mails.slice(0, safeLimit).map((m) => ({ ...m }));
    },
    async listFlagged(limit) {
      const safeLimit = Number.isFinite(limit)
        ? Math.max(0, Math.floor(limit))
        : 0;
      return mails
        .filter((mail) => mail.flagged)
        .slice(0, safeLimit)
        .map((m) => ({ ...m }));
    },
  };
}
