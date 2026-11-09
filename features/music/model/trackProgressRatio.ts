import type { NowPlayingPlayback } from "@/features/music/model/nowPlayingPlayback";

/** Ratio de progression [0, 1]. */
export function trackProgressRatio(playback: NowPlayingPlayback): number {
  if (playback.durationSec <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, playback.positionSec / playback.durationSec));
}
