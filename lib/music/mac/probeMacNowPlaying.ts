import "server-only";

import { classifyAudioApp } from "@/lib/music/mac/classifyAudioApp";
import { fetchDeezerTrackFromWindowMenu } from "@/lib/music/mac/fetchDeezerTrackFromWindowMenu";
import { fetchWindowTitle } from "@/lib/music/mac/fetchWindowTitle";
import { parsePlayingAssertions } from "@/lib/music/mac/parsePlayingAssertions";
import { parseYoutubeWindowTitle } from "@/lib/music/mac/parseYoutubeWindowTitle";
import { runMacCommand } from "@/lib/music/mac/runMacCommand";
import type { NowPlayingSnapshot } from "@/lib/music/nowPlayingSnapshot";

const SOURCE_ORDER = [
  "deezer",
  "youtube",
  "spotify",
  "apple_music",
  "browser",
  "other",
] as const;

/** Snapshot macOS : app qui joue + titre (Deezer menu / YouTube fenêtre). */
export function probeMacNowPlaying(): NowPlayingSnapshot {
  if (process.platform !== "darwin") {
    return idleSnapshot();
  }

  const assertions = runMacCommand("pmset", ["-g", "assertions"], 3000);
  if (!assertions.ok) {
    return idleSnapshot();
  }

  const playing = parsePlayingAssertions(assertions.stdout)
    .map(({ app }) => {
      const hint = fetchWindowTitle(app);
      const { kind, detail } = classifyAudioApp(app, hint);
      return { app, kind, detail };
    })
    .filter((source) => source.kind !== "noise");

  if (playing.length === 0) {
    return idleSnapshot();
  }

  const ranked = playing.slice().sort((a, b) => {
    const ai = SOURCE_ORDER.indexOf(a.kind as (typeof SOURCE_ORDER)[number]);
    const bi = SOURCE_ORDER.indexOf(b.kind as (typeof SOURCE_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  const top = ranked[0]!;

  if (top.kind === "deezer") {
    const track = fetchDeezerTrackFromWindowMenu();
    return {
      playing: true,
      source: "deezer",
      title: track?.title ?? "",
      artist: track?.artist ?? "",
      app: top.app,
    };
  }

  if (top.kind === "youtube") {
    const parsed = parseYoutubeWindowTitle(top.detail);
    return {
      playing: true,
      source: "youtube",
      title: parsed.title,
      artist: parsed.artist,
      app: top.app,
    };
  }

  if (top.kind === "browser") {
    return {
      playing: true,
      source: "browser",
      title: top.detail.replace(/^[a-z]+:\s*/i, "").trim(),
      artist: "",
      app: top.app,
    };
  }

  const source =
    top.kind === "spotify" || top.kind === "apple_music" || top.kind === "other"
      ? top.kind
      : "other";

  return {
    playing: true,
    source,
    title: "",
    artist: "",
    app: top.app,
  };
}

function idleSnapshot(): NowPlayingSnapshot {
  return {
    playing: false,
    source: "none",
    title: "",
    artist: "",
    app: "",
  };
}
