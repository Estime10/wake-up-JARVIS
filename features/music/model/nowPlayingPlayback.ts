/** État de lecture (horloge + transport). */
export type NowPlayingPlayback = {
  /** Position lecture (secondes). */
  positionSec: number;
  /** Durée totale (secondes). */
  durationSec: number;
  playing: boolean;
};
