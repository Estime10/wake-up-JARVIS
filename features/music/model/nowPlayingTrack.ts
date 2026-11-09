import type { NowPlayingIdentity } from "@/features/music/model/nowPlayingIdentity";
import type { NowPlayingPlayback } from "@/features/music/model/nowPlayingPlayback";

/** Piste Now Playing = identité + lecture. */
export type NowPlayingTrack = NowPlayingIdentity & NowPlayingPlayback;
