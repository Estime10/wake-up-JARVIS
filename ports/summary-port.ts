export type SummaryInput = {
  subject: string;
  bodyText: string;
};

/**
 * Résumé mail — appelé seulement après consentement explicite (ADR 0010).
 * Le corps ne doit jamais être persisté hors de cet appel.
 */
export interface SummaryPort {
  summarize(input: SummaryInput): Promise<string>;
}
