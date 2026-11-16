import "server-only";

import { runMacCommand } from "@/lib/music/mac/runMacCommand";
import { systemEventsProcessName } from "@/lib/music/mac/systemEventsProcessName";

/** Titres de fenêtres System Events (hint YouTube, etc.). */
export function fetchWindowTitle(app: string): string {
  const proc = systemEventsProcessName(app);
  const script = `
tell application "System Events"
  if not (exists process "${proc}") then return ""
  tell process "${proc}"
    try
      set titles to name of every window
      set AppleScript's text item delimiters to " || "
      set joined to titles as text
      set AppleScript's text item delimiters to ""
      return joined
    on error
      return ""
    end try
  end tell
end tell
`.trim();
  const result = runMacCommand("osascript", ["-e", script], 2000);
  if (!result.ok) {
    return "";
  }
  return result.stdout.trim();
}
