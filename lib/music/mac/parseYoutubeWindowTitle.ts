import "server-only";

export type YoutubeTitleHint = {
  title: string;
  artist: string;
  raw: string;
};

/** Extrait titre/artiste depuis un titre de fenêtre navigateur YouTube. */
export function parseYoutubeWindowTitle(detail: string): YoutubeTitleHint {
  const raw = detail.replace(/^[a-z]+:\s*/i, "").trim();
  const cleaned = raw
    .replace(/\s*-\s*YouTube.*$/i, "")
    .replace(/\s*[–—].*Brave.*$/i, "")
    .replace(/\s*[–—].*Chrome.*$/i, "")
    .replace(/\s*–\s*Lecture audio.*$/i, "")
    .trim();

  const dashDash = cleaned.split(/\s+--\s+/);
  if (dashDash.length >= 2) {
    return {
      title: dashDash[0]!.trim(),
      artist: dashDash.slice(1).join(" -- ").trim(),
      raw,
    };
  }

  return { title: cleaned, artist: "", raw };
}
