/**
 * Horloge HUD intro — `HH:MM · DD.MM.YY` (décor, mono).
 * Domaine pur : pas de React.
 */
export function formatIntroClock(date: Date): string {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${hh}:${mm} · ${dd}.${mo}.${yy}`;
}
