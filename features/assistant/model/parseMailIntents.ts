import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import {
  MAIL_COUNT_PATTERNS,
  MAIL_GENERIC_REJECT,
  MAIL_LIST_BY_LABEL_PATTERNS,
  MAIL_LIST_FLAGGED_PATTERNS,
  MAIL_LIST_RECENT_PATTERNS,
  MAIL_LIST_SENT_BY_LABEL_PATTERNS,
} from "@/features/assistant/model/intents/mailIntentCatalog";
import {
  matchIntentPatterns,
  sanitizeCapturedToken,
} from "@/features/assistant/model/matchIntentPatterns";

function labelFromMatch(match: RegExpMatchArray): string | null {
  const raw = match[1]?.trim();
  if (!raw) {
    return null;
  }
  const label = sanitizeCapturedToken(raw);
  if (!label || MAIL_GENERIC_REJECT.test(label)) {
    return null;
  }
  return label;
}

/**
 * Intents mail — ordre : sent-by-label → flagged → count → recent → by-label.
 */
export function parseMailIntents(text: string): AssistantIntent | null {
  const sent = matchIntentPatterns(text, MAIL_LIST_SENT_BY_LABEL_PATTERNS);
  if (sent) {
    const label = labelFromMatch(sent);
    if (label) {
      return { kind: "mail.list_sent_by_label", label };
    }
  }

  if (matchIntentPatterns(text, MAIL_LIST_FLAGGED_PATTERNS)) {
    return { kind: "mail.list_flagged" };
  }

  if (matchIntentPatterns(text, MAIL_COUNT_PATTERNS)) {
    return { kind: "mail.count" };
  }

  if (matchIntentPatterns(text, MAIL_LIST_RECENT_PATTERNS)) {
    return { kind: "mail.list_recent" };
  }

  const byLabel = matchIntentPatterns(text, MAIL_LIST_BY_LABEL_PATTERNS);
  if (byLabel) {
    const label = labelFromMatch(byLabel);
    if (label) {
      return { kind: "mail.list_by_label", label };
    }
  }

  return null;
}

/** @deprecated — préférer parseMailIntents. */
export function parseMailLabelIntent(
  text: string,
): Extract<AssistantIntent, { kind: "mail.list_by_label" }> | null {
  const intent = parseMailIntents(text);
  return intent?.kind === "mail.list_by_label" ? intent : null;
}
