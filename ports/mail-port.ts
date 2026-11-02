import type { MailSummary } from "@/lib/schemas";

export interface MailPort {
  /** Lecture seule. */
  listRecent(limit: number): Promise<MailSummary[]>;
}
