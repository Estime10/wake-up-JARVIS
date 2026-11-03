import { formatMailTitlesReply } from "@/features/assistant/model/formatMailTitlesReply";
import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import { t } from "@/lib/i18n";
import type { MailPort } from "@/ports/mail-port";

const MAIL_LIMIT = 50;
const RECENT_LIMIT = 20;

/**
 * Réponses mail + aide (sans LLM, utilisable mock/client).
 * GitHub est exécuté côté serveur dans `buildAssistantReply`.
 */
export async function buildIntentAssistantReply(
  text: string,
  mail: MailPort,
): Promise<string> {
  const intent = parseAssistantIntent(text);

  if (!intent) {
    return t("assistant.fallbackCapability");
  }

  if (intent.kind === "help") {
    return t("assistant.help");
  }

  if (
    intent.kind === "github.status" ||
    intent.kind === "github.list_repos" ||
    intent.kind === "github.list_pulls" ||
    intent.kind === "github.list_commits" ||
    intent.kind === "github.list_branches"
  ) {
    return t("assistant.githubNeedsLive");
  }

  if (intent.kind === "mail.list_flagged") {
    const items = await mail.listFlagged(MAIL_LIMIT);
    return formatMailTitlesReply(
      t("assistant.mailFlaggedLabel"),
      items.map((item) => ({ from: item.from, excerpt: item.excerpt })),
    );
  }

  if (intent.kind === "mail.list_recent") {
    const items = await mail.listRecent(RECENT_LIMIT);
    return formatMailTitlesReply(
      t("assistant.mailRecentLabel"),
      items.map((item) => ({ from: item.from, excerpt: item.excerpt })),
    );
  }

  if (intent.kind === "mail.count") {
    const items = await mail.listRecent(500);
    return t("assistant.mailCount", { count: items.length });
  }

  if (intent.kind === "mail.list_sent_by_label") {
    const items = await mail.listSentByLabel(intent.label, MAIL_LIMIT);
    return formatMailTitlesReply(
      intent.label,
      items.map((item) => ({ from: item.from, excerpt: item.excerpt })),
    );
  }

  const items = await mail.listByLabel(intent.label, MAIL_LIMIT);
  return formatMailTitlesReply(
    intent.label,
    items.map((item) => ({ from: item.from, excerpt: item.excerpt })),
  );
}
