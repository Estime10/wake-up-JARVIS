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

function mailLineForCount(count: number): string {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(
      `count must be a non-negative integer, received ${count}`,
    );
  }
  if (count === 0) {
    return t("greeting.mailLineZero");
  }
  if (count === 1) {
    return t("greeting.mailLineOne");
  }
  return t("greeting.mailLineMany", { count });
}

/**
 * Salut TTS briefing home — systèmes + volume mails du jour.
 */
export function spokenBriefing(
  hour: number,
  name: string,
  mailCountToday: number,
): string {
  assertHour(hour);
  const base = spokenGreeting(hour, name);
  return `${base} ${mailLineForCount(mailCountToday)}`;
}
