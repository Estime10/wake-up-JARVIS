import { t } from "@/lib/i18n";

function assertHour(hour: number): void {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new RangeError(`hour must be an integer in 0..23, received ${hour}`);
  }
}

function isMorning(hour: number): boolean {
  return hour >= 5 && hour < 18;
}

/**
 * Salut UI selon l'heure locale (domaine pur, sans React).
 * 05:00–17:59 → Bonjour ; sinon → Bonsoir.
 */
export function greeting(
  hour: number,
  name: string = t("user.displayName"),
): string {
  assertHour(hour);
  const key = isMorning(hour) ? "greeting.morning" : "greeting.evening";
  return t(key, { name });
}

/**
 * Salut TTS — Bonjour/Bonsoir + name, puis statut systèmes.
 */
export function spokenGreeting(
  hour: number,
  name: string = t("user.displayName"),
): string {
  assertHour(hour);
  const key = isMorning(hour)
    ? "greeting.spokenMorning"
    : "greeting.spokenEvening";
  return t(key, { name });
}
