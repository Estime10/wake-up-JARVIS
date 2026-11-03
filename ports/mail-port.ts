import type { MailSummary } from "@/lib/schemas";

export interface MailPort {
  /** Lecture seule — mails récents (mock ou DB). */
  listRecent(limit: number): Promise<MailSummary[]>;
  /**
   * Mails signalés (flagged) — ADR 0010 étape 2.
   * Défaut mock : sous-ensemble de listRecent si pas d’adapter réel.
   */
  listFlagged(limit: number): Promise<MailSummary[]>;
  /**
   * Mails reçus dont la catégorie matche le label (égalité, préfixe, racine).
   * Fenêtre = listRecent (J-2…). Hors SENT.
   */
  listByLabel(label: string, limit: number): Promise<MailSummary[]>;
  /**
   * Mails envoyés (SENT) dont la catégorie matche le label — pour l’agent
   * (« ce que j’ai répondu »), jamais le feed UI.
   */
  listSentByLabel(label: string, limit: number): Promise<MailSummary[]>;
  /** Tous les envois récents (SENT) — agent only. */
  listSent(limit: number): Promise<MailSummary[]>;
}
