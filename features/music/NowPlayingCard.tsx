"use client";

import { useState } from "react";

import { NowPlayingMeta } from "@/features/music/components/NowPlayingMeta";
import { NowPlayingTimeline } from "@/features/music/components/NowPlayingTimeline";
import { NowPlayingTransport } from "@/features/music/components/NowPlayingTransport";
import { MOCK_NOW_PLAYING_TRACK } from "@/features/music/model/mockNowPlayingTrack";
import type { NowPlayingTrack } from "@/features/music/model/nowPlayingTrack";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";

type NowPlayingCardProps = {
  track?: NowPlayingTrack;
  className?: string;
};

/**
 * Orchestrateur chrome musique — compose meta / timeline / transport.
 */
export function NowPlayingCard({
  track = MOCK_NOW_PLAYING_TRACK,
  className,
}: NowPlayingCardProps) {
  const [playing, setPlaying] = useState(track.playing);

  return (
    <section
      className={cn(
        "relative mx-auto flex w-full max-w-[16rem] flex-col items-stretch gap-3 px-5 py-4 sm:max-w-[18rem] sm:px-6 sm:py-5",
        className,
      )}
      aria-label={t("music.nowPlayingLabel")}
    >
      <NowPlayingMeta identity={track} />
      <NowPlayingTimeline playback={{ ...track, playing }} />
      <NowPlayingTransport
        playing={playing}
        onTogglePlay={() => {
          setPlaying((prev) => !prev);
        }}
      />
    </section>
  );
}
