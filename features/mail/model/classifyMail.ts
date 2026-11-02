import type { MailRule } from "@/features/mail/model/mailRule";

export const DEFAULT_MAIL_CATEGORY = "DIVERS/À trier";

type ClassifyInput = {
  fromRaw: string;
  subject: string;
};

function tryMatch(pattern: string, haystack: string): boolean {
  try {
    return new RegExp(pattern, "i").test(haystack);
  } catch {
    return haystack.toLowerCase().includes(pattern.toLowerCase());
  }
}

/**
 * Tri déterministe ADR 0010 : expéditeur (priority asc) → objet → défaut.
 * Même entrée + mêmes règles → même catégorie.
 */
export function classifyMail(
  input: ClassifyInput,
  rules: readonly MailRule[],
): string {
  const senderRules = rules
    .filter((rule) => rule.matchType === "sender")
    .slice()
    .sort((a, b) => a.priority - b.priority);

  for (const rule of senderRules) {
    if (tryMatch(rule.pattern, input.fromRaw)) {
      return rule.category;
    }
  }

  const subjectRules = rules
    .filter((rule) => rule.matchType === "subject")
    .slice()
    .sort((a, b) => a.priority - b.priority);

  for (const rule of subjectRules) {
    if (tryMatch(rule.pattern, input.subject)) {
      return rule.category;
    }
  }

  return DEFAULT_MAIL_CATEGORY;
}
