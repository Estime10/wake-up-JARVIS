/**
 * Fenêtre métier JARVIS : mails depuis le début de J-2 (2 jours + aujourd’hui).
 * Calendrier local — pas d’historique long.
 */

/** Début de fenêtre = minuit il y a 2 jours (J-2 inclus). */
export function startOfMailWindow(now: Date = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 2);
  return start;
}

/** @deprecated alias — préférer `startOfMailWindow`. */
export const startOfYesterday = startOfMailWindow;

/**
 * Clause Gmail `after:YYYY/M/D` — jour **avant** le début de fenêtre
 * (`after:` est exclusif sur la date calendaire Google).
 */
export function gmailAfterDateQuery(now: Date = new Date()): string {
  const exclusive = startOfMailWindow(now);
  exclusive.setDate(exclusive.getDate() - 1);
  return `after:${exclusive.getFullYear()}/${exclusive.getMonth() + 1}/${exclusive.getDate()}`;
}

export function isWithinMailWindow(
  receivedAt: Date,
  now: Date = new Date(),
): boolean {
  return receivedAt.getTime() >= startOfMailWindow(now).getTime();
}
