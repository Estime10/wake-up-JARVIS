import { JarvisMark } from "@/components/ui/JarvisMark";
import { snapshotLocalWeather } from "@/features/intro/model/snapshotLocalWeather";
import { t } from "@/lib/i18n";

/**
 * Logo intro + axe horizontal (ville · humidité).
 * L'axe est animé GSAP après la séquence (haut → milieu).
 */
export function SplashMarkStage() {
  const weather = snapshotLocalWeather();

  return (
    <div
      data-flip-id="ring"
      data-intro="mark"
      className="relative flex size-[min(72vw,22rem)] items-center justify-center text-accent opacity-0 sm:size-[min(52vw,28rem)]"
      aria-hidden
    >
      <div
        data-intro="axis"
        className="pointer-events-none absolute inset-x-0 top-1/2 z-0"
      >
        <div className="relative -translate-y-1/2">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-linear-to-r from-transparent via-hud-strong to-transparent" />
          <span className="dial absolute top-1/2 left-0 -translate-x-[calc(100%+0.75rem)] -translate-y-1/2 text-hud-strong">
            {weather.city}
          </span>
          <span className="dial absolute top-1/2 right-0 translate-x-[calc(100%+0.75rem)] -translate-y-1/2 text-hud-strong">
            {t("intro.humidity", { percent: weather.humidityPercent })}
          </span>
        </div>
      </div>

      <JarvisMark className="relative z-10 size-full" />
    </div>
  );
}
