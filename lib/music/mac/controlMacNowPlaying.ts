import "server-only";

import { clickDeezerPlaybackMenuItem } from "@/lib/music/mac/clickDeezerPlaybackMenuItem";
import { probeMacNowPlaying } from "@/lib/music/mac/probeMacNowPlaying";
import type { MusicTransportAction } from "@/lib/music/musicTransportAction";
import type { NowPlayingSnapshot } from "@/lib/music/nowPlayingSnapshot";

export type ControlMacNowPlayingResult = {
  ok: boolean;
  snapshot: NowPlayingSnapshot;
};

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isDeezer(snapshot: NowPlayingSnapshot): boolean {
  return (
    snapshot.source === "deezer" ||
    snapshot.app.toLowerCase().includes("deezer")
  );
}

/**
 * Fallback API (hors shell Tauri) — menus Deezer via System Events, sans focus.
 * Les touches média système vivent dans `src-tauri` (`music_transport`).
 */
export async function controlMacNowPlaying(
  action: MusicTransportAction,
): Promise<ControlMacNowPlayingResult> {
  if (process.platform !== "darwin") {
    return { ok: false, snapshot: probeMacNowPlaying() };
  }

  const before = probeMacNowPlaying();

  if (action === "next" || action === "previous") {
    const ok = isDeezer(before) ? clickDeezerPlaybackMenuItem(action) : false;
    await sleepMs(400);
    return { ok, snapshot: probeMacNowPlaying() };
  }

  const wantPlaying = !before.playing;
  const ok = await togglePlayback(before, wantPlaying);
  const after = probeMacNowPlaying();

  return {
    ok,
    snapshot: {
      ...after,
      playing: ok ? wantPlaying : after.playing,
      title: after.title || before.title,
      artist: after.artist || before.artist,
      source: after.source !== "none" ? after.source : before.source,
      app: after.app || before.app,
    },
  };
}

async function togglePlayback(
  before: NowPlayingSnapshot,
  wantPlaying: boolean,
): Promise<boolean> {
  if (!isDeezer(before)) {
    return false;
  }

  if (wantPlaying) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      clickDeezerPlaybackMenuItem("play");
      await sleepMs(700);
      if (probeMacNowPlaying().playing) {
        return true;
      }
    }
    return false;
  }

  let ok = false;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    ok = clickDeezerPlaybackMenuItem("pause");
    await sleepMs(450);
    if (!probeMacNowPlaying().playing) {
      return true;
    }
  }
  return ok;
}
