/** Relative FR courte pour listes commits (Intl). */
export function formatRelativeTime(iso: string, now = new Date()): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return "—";
  }
  const diffSec = Math.round((then - now.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

  if (abs < 60) {
    return rtf.format(diffSec, "second");
  }
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) {
    return rtf.format(diffMin, "minute");
  }
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 48) {
    return rtf.format(diffHour, "hour");
  }
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 60) {
    return rtf.format(diffDay, "day");
  }
  const diffMonth = Math.round(diffDay / 30);
  return rtf.format(diffMonth, "month");
}
