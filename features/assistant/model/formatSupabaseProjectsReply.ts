import { t } from "@/lib/i18n";

export type SupabaseProjectListEntry = {
  accountLabel: string;
  name: string;
  ref: string;
  region?: string;
};

/**
 * Liste projets style mails — n. NOM + compte / ref.
 */
export function formatSupabaseProjectsReply(
  entries: readonly SupabaseProjectListEntry[],
): string {
  if (entries.length === 0) {
    return t("assistant.supabaseProjectsEmpty");
  }

  const blocks = entries.map((entry, index) => {
    const head = `${index + 1}. ${entry.name.toLocaleUpperCase("fr-FR")}`;
    const meta = entry.region
      ? `${entry.accountLabel} · ${entry.ref} · ${entry.region}`
      : `${entry.accountLabel} · ${entry.ref}`;
    return `${head}\n${meta}`;
  });

  return `${t("assistant.supabaseProjectsHeader")}\n${blocks.join("\n\n")}`;
}
