import type { MusicTransportAction } from "@/lib/music/musicTransportAction";
import type { NowPlayingSnapshot } from "@/lib/music/nowPlayingSnapshot";

export type MusicTransportResult = {
  accepted: boolean;
  snapshot: NowPlayingSnapshot;
};

/** Now Playing hôte — shell Tauri (local) ou API Next (fallback). */
export interface MusicPort {
  getNowPlaying(signal?: AbortSignal): Promise<NowPlayingSnapshot | null>;
  transport(
    action: MusicTransportAction,
    signal?: AbortSignal,
  ): Promise<MusicTransportResult | null>;
}
