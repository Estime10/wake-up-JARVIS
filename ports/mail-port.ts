import type { MailSummary } from "@/lib/schemas";

export interface MailPort {
  /** Lecture seule — mails récents (mock ou DB). */
  listRecent(limit: number): Promise<MailSummary[]>;
  /**
   * Mails signalés (flagged) — ADR 0010 étape 2.
   * Défaut mock : sous-ensemble de listRecent si pas d’adapter réel.
   */
  listFlagged(limit: number): Promise<MailSummary[]>;
}
