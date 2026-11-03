import { mailSenderDisplayName } from "@/features/mail/model/mailSenderDisplayName";
import type { SysPressureState } from "@/features/intro/model/sysPressureState";
import { t } from "@/lib/i18n";

/** Phrase TTS — arrivée de mails (sans clic). */
export function spokenMailArrival(
  items: readonly { from: string }[],
): string | null {
  if (items.length === 0) {
    return null;
  }
  if (items.length === 1) {
    const name = mailSenderDisplayName(items[0]!.from).trim();
    if (name.length === 0) {
      return t("greeting.spokenMailNewGeneric");
    }
    return t("greeting.spokenMailNewOne", { name });
  }
  return t("greeting.spokenMailNewMany", { count: items.length });
}

/** Phrase TTS — changement de pression CPU. */
export function spokenSysPressureChange(
  state: SysPressureState,
): string | null {
  switch (state) {
    case "nominal":
      return t("greeting.spokenSysNominal");
    case "fair":
      return t("greeting.spokenSysFair");
    case "serious":
      return t("greeting.spokenSysSerious");
    case "critical":
      return t("greeting.spokenSysCritical");
    case "unknown":
      return null;
  }
}
