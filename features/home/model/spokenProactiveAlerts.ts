import { formatMailFromList } from "@/features/mail/model/formatMailFromList";
import { mailSenderDisplayName } from "@/features/mail/model/mailSenderDisplayName";
import type { SysPressureState } from "@/features/intro/model/sysPressureState";
import { t } from "@/lib/i18n";

const PRESSURE_RANK: Record<SysPressureState, number> = {
  unknown: 0,
  nominal: 1,
  fair: 2,
  serious: 3,
  critical: 4,
};

function uniqueSenderNames(items: readonly { from: string }[]): string[] {
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
  return names;
}

export { formatMailFromList };

/** Phrase TTS — arrivée de mails : nombre + noms, jamais de snippet. */
export function spokenMailArrival(
  items: readonly { from: string }[],
): string | null {
  if (items.length === 0) {
    return null;
  }

  const names = uniqueSenderNames(items);

  if (items.length === 1) {
    if (names.length === 0) {
      return t("greeting.spokenMailNewGeneric");
    }
    return t("greeting.spokenMailNewOne", { name: names[0]! });
  }

  const fromList = formatMailFromList(names);
  if (!fromList) {
    return t("greeting.spokenMailNewManyPlain", { count: items.length });
  }
  return t("greeting.spokenMailNewMany", {
    count: items.length,
    fromList,
  });
}

/**
 * Alerte CPU — uniquement si la charge **augmente**.
 * Jamais d’annonce en nominal / unknown, ni au retour vers le bas.
 */
export function spokenSysPressureChange(
  next: SysPressureState,
  previous: SysPressureState | null = null,
): string | null {
  if (next === "nominal" || next === "unknown") {
    return null;
  }
  if (previous !== null && PRESSURE_RANK[next] <= PRESSURE_RANK[previous]) {
    return null;
  }

  switch (next) {
    case "fair":
      return t("greeting.spokenSysFair");
    case "serious":
      return t("greeting.spokenSysSerious");
    case "critical":
      return t("greeting.spokenSysCritical");
    default:
      return null;
  }
}
