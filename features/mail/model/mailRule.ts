export type MailRuleMatchType = "sender" | "subject";

/** Règle de tri déterministe (DB → domaine). */
export type MailRule = {
  matchType: MailRuleMatchType;
  pattern: string;
  category: string;
  priority: number;
};
