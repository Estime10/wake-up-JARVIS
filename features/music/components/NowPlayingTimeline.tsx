import { formatTrackRemaining } from "@/features/music/model/formatTrackRemaining";
import { formatTrackTime } from "@/features/music/model/formatTrackTime";
import type { NowPlayingPlayback } from "@/features/music/model/nowPlayingPlayback";
import { trackProgressRatio } from "@/features/music/model/trackProgressRatio";
import { trackRemainingSec } from "@/features/music/model/trackRemainingSec";
import { t } from "@/lib/i18n/t";

type NowPlayingTimelineProps = {
  playback: NowPlayingPlayback;
};

/** Temps restant · barre · durée totale. */
export function NowPlayingTimeline({ playback }: NowPlayingTimelineProps) {
  const remainingSec = trackRemainingSec(playback);
  const progress = trackProgressRatio(playback);

  return (
    <div className="t-mono flex items-center gap-3 text-sm leading-none text-text">
      <span className="w-10 shrink-0 text-left tabular-nums">
        {formatTrackRemaining(remainingSec)}
      </span>
      <div
        className="relative h-0.5 min-w-0 flex-1 overflow-hidden bg-text/25"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={playback.durationSec}
        aria-valuenow={playback.positionSec}
        aria-label={t("music.progressLabel")}
      >
        <div
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right tabular-nums">
        {formatTrackTime(playback.durationSec)}
      </span>
    </div>
  );
}
