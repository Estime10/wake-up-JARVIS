import { formatNowPlayingSource } from "@/features/music/model/formatNowPlayingSource";
import type { NowPlayingSnapshot } from "@/features/music/model/nowPlayingSnapshot";
import { t } from "@/lib/i18n/t";

type NowPlayingSourceProps = {
  source: NowPlayingSnapshot["source"];
};

/** Ligne source (remplace l’ancienne timeline temps). */
export function NowPlayingSource({ source }: NowPlayingSourceProps) {
  const label = formatNowPlayingSource(source);

  return (
    <p
      className="t-mono truncate text-center text-sm leading-none text-text/70"
      aria-label={t("music.sourceLabel")}
    >
      {label}
    </p>
  );
}
