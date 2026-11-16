import "server-only";

export type AudioSourceKind =
  | "deezer"
  | "youtube"
  | "spotify"
  | "apple_music"
  | "browser"
  | "other"
  | "noise";

const NOISE_APPS = new Set([
  "cursor",
  "code",
  "code helper",
  "electron",
  "zoom",
  "zoom.us",
  "slack",
  "discord",
  "figma",
  "notion",
]);

const BROWSER_APPS = new Map([
  ["google chrome", "chrome"],
  ["brave browser", "brave"],
  ["safari", "safari"],
  ["arc", "arc"],
  ["firefox", "firefox"],
  ["microsoft edge", "edge"],
  ["dia", "dia"],
  ["orion", "orion"],
]);

const YOUTUBE_RE = /youtube|youtu\.be|music\.youtube/i;

export function classifyAudioApp(
  app: string,
  windowHint: string,
): { kind: AudioSourceKind; detail: string } {
  const lower = app.trim().toLowerCase();
  if (lower === "deezer") {
    return { kind: "deezer", detail: windowHint };
  }
  if (lower === "spotify") {
    return { kind: "spotify", detail: windowHint };
  }
  if (lower === "music" || lower === "apple music") {
    return { kind: "apple_music", detail: windowHint };
  }

  let browserKey = BROWSER_APPS.get(lower) ?? null;
  if (!browserKey) {
    for (const [name, key] of BROWSER_APPS) {
      if (lower.startsWith(name)) {
        browserKey = key;
        break;
      }
    }
  }
  if (browserKey) {
    if (YOUTUBE_RE.test(windowHint)) {
      return {
        kind: "youtube",
        detail: `${browserKey}: ${windowHint}`.trim(),
      };
    }
    return { kind: "browser", detail: `${browserKey}: ${windowHint}`.trim() };
  }

  if (NOISE_APPS.has(lower) || lower.endsWith(" helper")) {
    return { kind: "noise", detail: windowHint };
  }
  return { kind: "other", detail: windowHint };
}
