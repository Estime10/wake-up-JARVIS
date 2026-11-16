import "server-only";

import { classifyAudioApp } from "@/lib/music/mac/classifyAudioApp";
import { fetchDeezerPlaybackState } from "@/lib/music/mac/fetchDeezerPlaybackState";
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

type RankedSource = {
  app: string;
  kind: string;
  detail: string;
};

/** Snapshot macOS : app qui joue + titre (Deezer menu / YouTube fenêtre). */
export function probeMacNowPlaying(): NowPlayingSnapshot {
  if (process.platform !== "darwin") {
    return idleSnapshot();
  }

  const deezerState = fetchDeezerPlaybackState();
  const deezerTrack = fetchDeezerTrackFromWindowMenu();

  const assertions = runMacCommand("pmset", ["-g", "assertions"], 3000);
  const ranked = assertions.ok ? rankPlayingSources(assertions.stdout) : [];

  const deezerInPmset = ranked.some((source) => source.kind === "deezer");
  const othersPlaying = ranked.filter((source) => source.kind !== "deezer");

  // Menu « Pause » ou assertion pmset Deezer → carte Deezer.
  // Menu « Lecture » (pause clavier) prime sur une assertion pmset collée.
  if (
    deezerState === "playing" ||
    (deezerInPmset && deezerState !== "paused")
  ) {
    return {
      playing: true,
      source: "deezer",
      title: deezerTrack?.title ?? "",
      artist: deezerTrack?.artist ?? "",
      app: "Deezer",
    };
  }

  if (deezerState === "paused" && deezerInPmset && othersPlaying.length === 0) {
    return {
      playing: false,
      source: "deezer",
      title: deezerTrack?.title ?? "",
      artist: deezerTrack?.artist ?? "",
      app: "Deezer",
    };
  }

  if (othersPlaying.length > 0) {
    return snapshotFromRanked(othersPlaying[0]!);
  }

  // Pause clavier : plus d'assertion pmset, mais piste encore dans Fenêtre.
  if (deezerState === "paused" && deezerTrack) {
    return {
      playing: false,
      source: "deezer",
      title: deezerTrack.title,
      artist: deezerTrack.artist,
      app: "Deezer",
    };
  }

  return idleSnapshot();
}

function rankPlayingSources(rawAssertions: string): RankedSource[] {
  const playing = parsePlayingAssertions(rawAssertions)
    .map(({ app }) => {
      const hint = fetchWindowTitle(app);
      const { kind, detail } = classifyAudioApp(app, hint);
      return { app, kind, detail };
    })
    .filter((source) => source.kind !== "noise");

  return playing.slice().sort((a, b) => {
    const ai = SOURCE_ORDER.indexOf(a.kind as (typeof SOURCE_ORDER)[number]);
    const bi = SOURCE_ORDER.indexOf(b.kind as (typeof SOURCE_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function snapshotFromRanked(top: RankedSource): NowPlayingSnapshot {
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
