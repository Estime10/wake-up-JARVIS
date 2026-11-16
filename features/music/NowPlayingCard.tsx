"use client";

import { NowPlayingMeta } from "@/features/music/components/NowPlayingMeta";
import { NowPlayingSource } from "@/features/music/components/NowPlayingSource";
import { useNowPlayingTrack } from "@/features/music/hooks/useNowPlayingTrack";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";

type NowPlayingCardProps = {
  className?: string;
};

/** Chrome musique — titre + artiste + source (lecture seule). */
export function NowPlayingCard({ className }: NowPlayingCardProps) {
  const { track } = useNowPlayingTrack();
  const identity = {
    title: track.title || t("music.idleTitle"),
    artist: track.artist || t("music.idleArtist"),
  };

  return (
    <section
      className={cn(
        "relative mx-auto flex w-full max-w-[16rem] flex-col items-stretch gap-3 px-5 py-4 sm:max-w-[18rem] sm:px-6 sm:py-5",
        className,
      )}
      aria-label={t("music.nowPlayingLabel")}
    >
      <NowPlayingMeta identity={identity} />
      <NowPlayingSource source={track.source} />
    </section>
  );
}
