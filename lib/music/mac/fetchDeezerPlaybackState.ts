import "server-only";

import { runMacCommand } from "@/lib/music/mac/runMacCommand";

export type DeezerPlaybackState = "playing" | "paused" | "absent" | "unknown";

/**
 * État play/pause Deezer via menu Lecture (fiable hors pmset).
 * Pause clavier → item « Lecture » ; lecture → item « Pause ».
 */
export function fetchDeezerPlaybackState(): DeezerPlaybackState {
  const script = `
tell application "System Events"
  if not (exists process "Deezer") then return "absent"
  tell process "Deezer"
    try
      if exists menu item "Pause" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        return "playing"
      end if
    end try
    try
      if exists menu item "Lecture" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        return "paused"
      end if
    end try
    try
      if exists menu item "Play" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        return "paused"
      end if
    end try
    return "unknown"
  end tell
end tell
`.trim();

  const result = runMacCommand("osascript", ["-e", script], 2500);
  if (!result.ok) {
    return "unknown";
  }
  const value = result.stdout.trim();
  if (
    value === "playing" ||
    value === "paused" ||
    value === "absent" ||
    value === "unknown"
  ) {
    return value;
  }
  return "unknown";
}
