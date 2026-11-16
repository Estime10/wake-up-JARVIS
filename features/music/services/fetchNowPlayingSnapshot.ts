import type { NowPlayingSnapshot } from "@/features/music/model/nowPlayingSnapshot";
import type { MusicPort } from "@/ports/music-port";

/** Délègue au MusicPort (Tauri local ou HTTP). */
export async function fetchNowPlayingSnapshot(
  music: MusicPort,
  signal?: AbortSignal,
): Promise<NowPlayingSnapshot | null> {
  return music.getNowPlaying(signal);
}
