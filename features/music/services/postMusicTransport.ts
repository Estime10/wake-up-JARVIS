import type { NowPlayingSnapshot } from "@/features/music/model/nowPlayingSnapshot";
import type { MusicTransportAction } from "@/lib/music/musicTransportAction";
import type { MusicPort } from "@/ports/music-port";

export type PostMusicTransportResult = {
  accepted: boolean;
  snapshot: NowPlayingSnapshot;
};

/** Délègue au MusicPort (Tauri local ou HTTP). */
export async function postMusicTransport(
  music: MusicPort,
  action: MusicTransportAction,
  signal?: AbortSignal,
): Promise<PostMusicTransportResult | null> {
  return music.transport(action, signal);
}
