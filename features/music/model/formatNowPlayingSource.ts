import type { NowPlayingSnapshot } from "@/features/music/model/nowPlayingSnapshot";

type NowPlayingSource = NowPlayingSnapshot["source"];

/** Libellé source pour le chrome player (noms propres, pas i18n). */
export function formatNowPlayingSource(source: NowPlayingSource): string {
  switch (source) {
    case "deezer":
      return "Deezer";
    case "youtube":
      return "YouTube";
    case "spotify":
      return "Spotify";
    case "apple_music":
      return "Apple Music";
    case "browser":
      return "Navigateur";
    case "other":
      return "Autre";
    case "none":
      return "—";
  }
}
