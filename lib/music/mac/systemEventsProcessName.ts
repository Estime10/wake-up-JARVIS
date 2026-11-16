import "server-only";

const PROCESS_ALIASES = new Map([
  ["chrome", "Google Chrome"],
  ["google chrome", "Google Chrome"],
  ["brave", "Brave Browser"],
  ["brave browser", "Brave Browser"],
  ["safari", "Safari"],
  ["arc", "Arc"],
  ["firefox", "Firefox"],
  ["microsoft edge", "Microsoft Edge"],
  ["edge", "Microsoft Edge"],
  ["dia", "Dia"],
  ["deezer", "Deezer"],
  ["spotify", "Spotify"],
  ["music", "Music"],
]);

/** Nom process System Events à partir du nom pmset. */
export function systemEventsProcessName(app: string): string {
  const lower = app.trim().toLowerCase();
  if (PROCESS_ALIASES.has(lower)) {
    return PROCESS_ALIASES.get(lower)!;
  }
  for (const [key, value] of PROCESS_ALIASES) {
    if (lower.startsWith(key)) {
      return value;
    }
  }
  return app;
}
