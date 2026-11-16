import type { MusicPort } from "@/ports/music-port";
import type { NowPlayingSnapshot } from "@/lib/music/nowPlayingSnapshot";

const IDLE: NowPlayingSnapshot = {
  playing: false,
  source: "none",
  title: "",
  artist: "",
  app: "",
};

/** Mock Now Playing — idle stable pour tests / sans hôte. */
export function createMockMusic(): MusicPort {
  let snapshot: NowPlayingSnapshot = { ...IDLE };

  return {
    async getNowPlaying() {
      return { ...snapshot };
    },
    async transport(action) {
      if (action === "toggle") {
        snapshot = { ...snapshot, playing: !snapshot.playing };
      }
      return { accepted: true, snapshot: { ...snapshot } };
    },
  };
}
