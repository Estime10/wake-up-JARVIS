import { formatTrackTime } from "@/features/music/model/formatTrackTime";

/** Temps restant affiché `-m:ss`. */
export function formatTrackRemaining(remainingSec: number): string {
  return `-${formatTrackTime(remainingSec)}`;
}
