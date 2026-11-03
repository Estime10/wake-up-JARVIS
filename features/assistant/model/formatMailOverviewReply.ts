import { t } from "@/lib/i18n";

export type MailOverviewBucket = {
  label: string;
  count: number;
};

/**
 * Vue d’ensemble — compteurs par label (lecture seule).
 */
export function formatMailOverviewReply(
  buckets: readonly MailOverviewBucket[],
  total: number,
): string {
  if (total === 0 || buckets.length === 0) {
    return t("assistant.mailOverviewEmpty");
  }

  const lines = buckets.map(
    (bucket, index) =>
      `${index + 1}. ${bucket.label.toLocaleUpperCase("fr-FR")} — ${bucket.count}`,
  );
  return `${t("assistant.mailOverviewHeader", { count: total })}\n${lines.join("\n")}`;
}
