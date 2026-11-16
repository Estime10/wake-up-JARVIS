import type { NowPlayingIdentity } from "@/features/music/model/nowPlayingIdentity";
import type { NowPlayingSnapshot } from "@/features/music/model/nowPlayingSnapshot";

/** Vue player : identité + source + état lecture (sans horloge). */
export type NowPlayingView = NowPlayingIdentity & {
  playing: boolean;
  source: NowPlayingSnapshot["source"];
};
