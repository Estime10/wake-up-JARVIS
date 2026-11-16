import "server-only";

import { clickDeezerPlaybackMenuItem } from "@/lib/music/mac/clickDeezerPlaybackMenuItem";
import { probeMacNowPlaying } from "@/lib/music/mac/probeMacNowPlaying";
import { sendSystemMediaKey } from "@/lib/music/mac/sendSystemMediaKey";
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
 * Transport sans vol de focus.
 * next/prev → touche média système.
 * toggle → média + menu Deezer (pause), avec vérif/retry.
 */
export async function controlMacNowPlaying(
  action: MusicTransportAction,
): Promise<ControlMacNowPlayingResult> {
  if (process.platform !== "darwin") {
    return { ok: false, snapshot: probeMacNowPlaying() };
  }

  const before = probeMacNowPlaying();

  if (action === "next" || action === "previous") {
    const ok = sendSystemMediaKey(action);
    await sleepMs(400);
    return { ok, snapshot: probeMacNowPlaying() };
  }

  const ok = await togglePlayback(before);
  const after = probeMacNowPlaying();

  return {
    ok,
    snapshot: {
      ...after,
      playing: !before.playing,
      title: after.title || before.title,
      artist: after.artist || before.artist,
      source: after.source !== "none" ? after.source : before.source,
      app: after.app || before.app,
    },
  };
}

async function togglePlayback(before: NowPlayingSnapshot): Promise<boolean> {
  const wantPlaying = !before.playing;

  if (!isDeezer(before) && before.source !== "none") {
    const ok = sendSystemMediaKey("toggle");
    await sleepMs(500);
    return ok;
  }

  if (wantPlaying) {
    const ok =
      sendSystemMediaKey("toggle") || clickDeezerPlaybackMenuItem("play");
    await sleepMs(500);
    return ok;
  }

  // Pause Deezer : retry jusqu'à ce que pmset confirme (menu parfois stale).
  let ok = false;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    ok = clickDeezerPlaybackMenuItem("pause") || sendSystemMediaKey("toggle");
    await sleepMs(450);
    const now = probeMacNowPlaying();
    if (!now.playing) {
      return true;
    }
  }
  return ok;
}
