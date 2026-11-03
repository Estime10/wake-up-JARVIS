import { decodeMailSnippet } from "@/features/assistant/model/decodeMailSnippet";
import { mailSenderDisplayName } from "@/features/mail/model/mailSenderDisplayName";
import { t } from "@/lib/i18n";

export type MailLabelReplyItem = {
  from: string;
  excerpt: string;
};

/**
 * Réponse agent — n. NOM (majuscules) + snippet en dessous.
 */
export function formatMailTitlesReply(
  label: string,
  items: readonly MailLabelReplyItem[],
): string {
  const entries = items
    .map((item) => {
      const name = mailSenderDisplayName(item.from).trim();
      const excerpt = decodeMailSnippet(item.excerpt)
        .trim()
        .replace(/\s+/g, " ");
      if (!name) {
        return null;
      }
      return {
        name: name.toLocaleUpperCase("fr-FR"),
        excerpt,
      };
    })
    .filter((entry): entry is { name: string; excerpt: string } =>
      Boolean(entry),
    );

  if (entries.length === 0) {
    return t("assistant.mailLabelEmpty", { label });
  }

  const header =
    entries.length === 1
      ? t("assistant.mailLabelOne", { label })
      : t("assistant.mailLabelMany", { label, count: entries.length });

  const blocks = entries.map((entry, index) => {
    const head = `${index + 1}. ${entry.name}`;
    return entry.excerpt.length > 0 ? `${head}\n${entry.excerpt}` : head;
  });

  return `${header}\n${blocks.join("\n\n")}`;
}
