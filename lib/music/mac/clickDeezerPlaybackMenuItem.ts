import "server-only";

import { runMacCommand } from "@/lib/music/mac/runMacCommand";

type DeezerMenuIntent = "toggle" | "pause" | "play" | "next" | "previous";

/**
 * Contrôle Deezer via menu Lecture — sans activate / sans focus.
 * Fallback API quand le shell Tauri (touches média) n'est pas disponible.
 */
export function clickDeezerPlaybackMenuItem(
  intent: DeezerMenuIntent = "toggle",
): boolean {
  const script =
    intent === "pause"
      ? pauseScript()
      : intent === "play"
        ? playScript()
        : intent === "next"
          ? nextScript()
          : intent === "previous"
            ? previousScript()
            : toggleScript();
  const result = runMacCommand("osascript", ["-e", script], 6000);
  return result.ok && result.stdout.trim() === "ok";
}

function pauseScript(): string {
  // Ne jamais cliquer « Lecture » quand on veut pauser (menu parfois stale).
  return `
tell application "System Events"
  if not (exists process "Deezer") then return "missing"
  tell process "Deezer"
    repeat 8 times
      try
        if exists menu item "Pause" of menu 1 of menu bar item "Lecture" of menu bar 1 then
          click menu item "Pause" of menu 1 of menu bar item "Lecture" of menu bar 1
          return "ok"
        end if
      end try
      delay 0.3
    end repeat
    return "fail"
  end tell
end tell
`.trim();
}

function playScript(): string {
  return `
tell application "System Events"
  if not (exists process "Deezer") then return "missing"
  tell process "Deezer"
    try
      if exists menu item "Lecture" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        click menu item "Lecture" of menu 1 of menu bar item "Lecture" of menu bar 1
        return "ok"
      end if
    end try
    try
      if exists menu item "Play" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        click menu item "Play" of menu 1 of menu bar item "Lecture" of menu bar 1
        return "ok"
      end if
    end try
    return "fail"
  end tell
end tell
`.trim();
}

function toggleScript(): string {
  return `
tell application "System Events"
  if not (exists process "Deezer") then return "missing"
  tell process "Deezer"
    try
      click menu item 1 of menu 1 of menu bar item "Lecture" of menu bar 1
      return "ok"
    on error
      return "fail"
    end try
  end tell
end tell
`.trim();
}

function nextScript(): string {
  return `
tell application "System Events"
  if not (exists process "Deezer") then return "missing"
  tell process "Deezer"
    try
      if exists menu item "Suivant" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        click menu item "Suivant" of menu 1 of menu bar item "Lecture" of menu bar 1
        return "ok"
      end if
    end try
    try
      if exists menu item "Next" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        click menu item "Next" of menu 1 of menu bar item "Lecture" of menu bar 1
        return "ok"
      end if
    end try
    return "fail"
  end tell
end tell
`.trim();
}

function previousScript(): string {
  return `
tell application "System Events"
  if not (exists process "Deezer") then return "missing"
  tell process "Deezer"
    try
      if exists menu item "Précédent" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        click menu item "Précédent" of menu 1 of menu bar item "Lecture" of menu bar 1
        return "ok"
      end if
    end try
    try
      if exists menu item "Previous" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        click menu item "Previous" of menu 1 of menu bar item "Lecture" of menu bar 1
        return "ok"
      end if
    end try
    return "fail"
  end tell
end tell
`.trim();
}
