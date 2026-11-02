/**
 * 8 types inhabituels (DevinChat 31/10) — signalement déterministe, sans IA.
 * Motifs stables pour l’UI / journal.
 */

export type UnusualFlag = {
  reason: string;
};

type FlagInput = {
  fromRaw: string;
  subject: string;
  snippet: string;
};

const RULES: readonly {
  reason: string;
  pattern: RegExp;
}[] = [
  {
    reason: "phishing",
    pattern:
      /urgem?ent.{0,40}(mot de passe|password|v[eé]rifi|compte|securit|security)|suspicious (sign[- ]?in|activity)|verify your (account|identity)/i,
  },
  {
    reason: "impayé",
    pattern: /impay[eé]|unpaid|past due|montant d[uû]|solde d[uû]|overdue/i,
  },
  {
    reason: "avocat ou recouvrement",
    pattern:
      /avocat|recouvrement|mise en demeure|huissier|collection agency|legal (notice|action)|counsel/i,
  },
  {
    reason: "paiement échoué",
    pattern:
      /paiement (echou|échou|refus)|payment (failed|declined)|carte refus|insufficient funds/i,
  },
  {
    reason: "alerte sécurité",
    pattern:
      /alerte de s[eé]curit|security alert|new sign[- ]?in|connexion (inhabituelle|suspecte)|2[- ]?step|two[- ]factor/i,
  },
  {
    reason: "réponse attendue",
    pattern:
      /en attente de (votre )?r[eé]ponse|awaiting your reply|please (respond|reply)|merci de (me )?r[eé]pondre/i,
  },
  {
    reason: "action demandée",
    pattern:
      /\b(peux[- ]tu|pouvez[- ]vous|can you|could you|merci de|please)\b.{0,80}\b(faire|envoyer|valider|confirmer|signer|send|confirm|review)\b/i,
  },
  {
    reason: "échéance",
    pattern:
      /\b(deadline|échéance|echeance|avant le|due (by|on|date)|expire[rs]? (le|on|soon))\b/i,
  },
];

/** Premier motif matché gagne (ordre stable de la liste). */
export function flagUnusual(input: FlagInput): UnusualFlag | null {
  const haystack = `${input.fromRaw}\n${input.subject}\n${input.snippet}`;
  for (const rule of RULES) {
    if (rule.pattern.test(haystack)) {
      return { reason: rule.reason };
    }
  }
  return null;
}
