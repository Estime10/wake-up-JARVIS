import { t } from "@/lib/i18n";

/**
 * Salut selon l'heure locale (domaine pur, sans React).
 * 05:00–17:59 → Bonjour ; sinon → Bonsoir.
 */
export function greeting(
  hour: number,
  name: string = t("user.displayName"),
): string {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError(`hour must be an integer in 0..23, received ${hour}`);
  }

  const key = hour >= 5 && hour < 18 ? "greeting.morning" : "greeting.evening";
  return t(key, { name });
}
