import "server-only";

import { runMacCommand } from "@/lib/music/mac/runMacCommand";

export type DeezerTrackHint = {
  title: string;
  artist: string;
  raw: string;
};

/**
 * Deezer n'écrit pas MediaRemote.
 * Menu Fenêtre : "Titre - Artiste - Deezer".
 */
export function fetchDeezerTrackFromWindowMenu(): DeezerTrackHint | null {
  const script = `
tell application "System Events"
  if not (exists process "Deezer") then return ""
  tell process "Deezer"
    try
      set names to name of every menu item of menu "Fenêtre" of menu bar 1
      set AppleScript's text item delimiters to linefeed
      set joined to names as text
      set AppleScript's text item delimiters to ""
      return joined
    on error
      return ""
    end try
  end tell
end tell
`.trim();
  const result = runMacCommand("osascript", ["-e", script], 2500);
  if (!result.ok) {
    return null;
  }
  const lines = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const hit = lines.find((line) => / - .+ - Deezer$/i.test(line));
  if (!hit) {
    return null;
  }
  const body = hit.replace(/\s*-\s*Deezer$/i, "");
  const sep = body.lastIndexOf(" - ");
  if (sep <= 0) {
    return { title: body, artist: "", raw: hit };
  }
  return {
    title: body.slice(0, sep).trim(),
    artist: body.slice(sep + 3).trim(),
    raw: hit,
  };
}
