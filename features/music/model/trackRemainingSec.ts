import type { NowPlayingPlayback } from "@/features/music/model/nowPlayingPlayback";

/** Secondes restantes jusqu’à la fin de la piste. */
export function trackRemainingSec(playback: NowPlayingPlayback): number {
  return Math.max(0, playback.durationSec - playback.positionSec);
}
