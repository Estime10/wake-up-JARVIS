import { t } from "@/lib/i18n";

/**
 * Priorité affichage : display_name → username → fallback i18n.
 */
export function resolveDisplayName(
  displayName: string | null | undefined,
  username: string | null | undefined,
): string {
  const fromDisplay = displayName?.trim();
  if (fromDisplay) {
    return fromDisplay;
  }
  const fromUsername = username?.trim();
  if (fromUsername) {
    return fromUsername;
  }
  return t("user.displayName");
}
