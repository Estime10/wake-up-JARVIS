import { formatMailFromList } from "@/features/mail/model/formatMailFromList";
import { mailSenderDisplayName } from "@/features/mail/model/mailSenderDisplayName";
import { t } from "@/lib/i18n";

/**
 * Liste mail lecture seule — noms d’expéditeurs du jour uniquement (pas de sujet / snippet).
 */
export function formatMailSendersReply(
  items: readonly { from: string }[],
): string {
  const names: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const name = mailSenderDisplayName(item.from).trim();
    if (!name) {
      continue;
    }
    const key = name.toLocaleLowerCase("fr-FR");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    names.push(name);
  }

  if (names.length === 0) {
    return t("assistant.mailSendersEmpty");
  }

  const fromList = formatMailFromList(names);
  if (items.length === 1) {
    return t("assistant.mailSendersOne", { fromList });
  }
  return t("assistant.mailSendersMany", {
    count: items.length,
    fromList,
  });
}
