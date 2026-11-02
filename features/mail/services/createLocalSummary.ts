import type { SummaryPort } from "@/ports/summary-port";

/**
 * Résumé local déterministe (pas d’IA tierce tant que le fournisseur n’est pas choisi).
 * Remplacera par un adapter IA derrière SummaryPort.
 */
export function createLocalSummary(): SummaryPort {
  return {
    async summarize({ subject, bodyText }) {
      const cleaned = bodyText.replace(/\s+/g, " ").trim();
      if (!cleaned) {
        return subject.trim() || "(sans contenu)";
      }
      const slice = cleaned.slice(0, 320);
      return cleaned.length > 320 ? `${slice}…` : slice;
    },
  };
}
