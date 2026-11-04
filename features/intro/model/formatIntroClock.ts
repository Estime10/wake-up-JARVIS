/**
 * Horloge HUD intro — pièces `HH:MM` / `DD.MM.YY` (décor, mono).
 * Domaine pur : pas de React.
 */

export function formatIntroTime(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatIntroDate(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}.${mo}.${yy}`;
}

/** `HH:MM · DD.MM.YY` — compat horloge compacte. */
export function formatIntroClock(date: Date): string {
  return `${formatIntroTime(date)} · ${formatIntroDate(date)}`;
}
