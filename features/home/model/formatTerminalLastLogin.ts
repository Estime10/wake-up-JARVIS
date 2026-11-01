const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * Ligne d'en-tête style macOS Terminal — horodatage réel.
 * Ex. `Last login: Sun Nov  1 00:26:51 on ttys000`
 */
export function formatTerminalLastLogin(date: Date, tty = "ttys000"): string {
  const weekday = WEEKDAYS[date.getDay()] ?? "Sun";
  const month = MONTHS[date.getMonth()] ?? "Jan";
  const day = String(date.getDate()).padStart(2, " ");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `Last login: ${weekday} ${month} ${day} ${hours}:${minutes}:${seconds} on ${tty}`;
}
