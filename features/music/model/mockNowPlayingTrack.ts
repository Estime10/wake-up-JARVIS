import type { NowPlayingTrack } from "@/features/music/model/nowPlayingTrack";

/** Fixture UI locale — remplacée plus tard par Now Playing macOS. */
export const MOCK_NOW_PLAYING_TRACK: NowPlayingTrack = {
  title: "Nightcall",
  artist: "Kavinsky",
  positionSec: 97,
  durationSec: 257,
  playing: true,
};
