import { Button } from "@/components/ui/Button/Button";
import { t } from "@/lib/i18n/t";

type NowPlayingTransportProps = {
  playing: boolean;
  onTogglePlay: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

/** Contrôles précédent · play/pause · suivant. */
export function NowPlayingTransport({
  playing,
  onTogglePlay,
  onPrevious,
  onNext,
}: NowPlayingTransportProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        type="button"
        variant="ghost"
        size="bare"
        className="t-content px-1 text-base leading-none"
        aria-label={t("music.previous")}
        onClick={onPrevious}
      >
        {t("music.previousGlyph")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="bare"
        className="t-content px-1 text-base leading-none text-accent"
        aria-label={playing ? t("music.pause") : t("music.play")}
        aria-pressed={playing}
        onClick={onTogglePlay}
      >
        {playing ? t("music.pauseGlyph") : t("music.playGlyph")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="bare"
        className="t-content px-1 text-base leading-none"
        aria-label={t("music.next")}
        onClick={onNext}
      >
        {t("music.nextGlyph")}
      </Button>
    </div>
  );
}
