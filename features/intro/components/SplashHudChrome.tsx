"use client";

import { useInboxMailCount } from "@/features/intro/hooks/useInboxMailCount";
import { useIntroClock } from "@/features/intro/hooks/useIntroClock";
import { useLocalTemperature } from "@/features/intro/hooks/useLocalTemperature";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type SplashHudChromeProps = {
  /** État final visible (home) — pas d'opacité 0 pour GSAP intro. */
  settled?: boolean;
};

/** Méta HUD — intro (targets GSAP) ou home figé (`settled`). */
export function SplashHudChrome({ settled = false }: SplashHudChromeProps) {
  const clock = useIntroClock();
  const mailCount = useInboxMailCount();
  const temperature = useLocalTemperature();
  const wakeText = t("intro.wakeDetected", { phrase: t("intro.wakePhrase") });

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 text-text-muted"
      aria-hidden
    >
      <div
        data-intro="hud-brackets"
        className={cn("absolute inset-0", !settled && "opacity-0")}
      >
        <CornerBracket className="top-3 left-3 border-t border-l sm:top-4 sm:left-4" />
        <CornerBracket className="top-3 right-3 border-t border-r sm:top-4 sm:right-4" />
        <CornerBracket className="bottom-3 left-3 border-b border-l sm:bottom-4 sm:left-4" />
        <CornerBracket className="right-3 bottom-3 border-r border-b sm:right-4 sm:bottom-4" />
      </div>

      <div
        data-intro="hud-corners"
        className={cn("absolute inset-0", !settled && "opacity-0")}
      >
        <div className="absolute top-6 left-6 flex flex-col gap-1 sm:top-8 sm:left-8">
          <p className="t-mono text-xs sm:text-sm">{t("intro.latLon")}</p>
          <p className="t-mono text-xs sm:text-sm">
            {t("intro.initProgress", { percent: 68 })}
          </p>
        </div>

        <div className="absolute top-6 right-6 flex flex-col items-end gap-1 sm:top-8 sm:right-8">
          {mailCount !== null ? (
            <p className="t-mono text-xs sm:text-sm">
              {t("intro.mailTotal", { count: mailCount })}
            </p>
          ) : null}
          {temperature !== null ? (
            <p className="t-mono text-xs sm:text-sm">
              {t("intro.temperature", { celsius: temperature })}
            </p>
          ) : null}
        </div>

        <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8">
          <p className="t-mono text-xs sm:text-sm">{clock ?? "—:— · —.—.—"}</p>
        </div>

        <div className="absolute right-6 bottom-6 sm:right-8 sm:bottom-8">
          <p className="t-mono text-xs sm:text-sm">{t("intro.sysNominal")}</p>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 flex max-w-[min(90vw,28rem)] -translate-x-1/2 items-center gap-2 sm:bottom-8">
        <WakeIcon settled={settled} />
        <p className="t-mono truncate text-xs sm:text-sm">
          {settled
            ? wakeText
            : wakeText.split("").map((char, index) => (
                <span
                  key={`${char}-${index}`}
                  data-intro="wake-char"
                  className="inline-block opacity-0"
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
        </p>
      </div>
    </div>
  );
}

function CornerBracket({ className }: { className: string }) {
  return (
    <span
      data-intro="hud-bracket"
      className={cn("absolute size-5 border-hud-strong sm:size-6", className)}
    />
  );
}

function WakeIcon({ settled }: { settled: boolean }) {
  const bars = [
    { x: 2.5, h: 5, y: 5.5 },
    { x: 5.5, h: 9, y: 3.5 },
    { x: 8.5, h: 12, y: 2 },
    { x: 11.5, h: 8, y: 4 },
    { x: 14.5, h: 5, y: 5.5 },
  ] as const;

  return (
    <svg
      data-intro="wake-icon"
      viewBox="0 0 18 16"
      className={cn(
        "size-3.5 shrink-0 origin-center text-text-muted sm:size-4",
        !settled && "opacity-0",
      )}
      fill="currentColor"
    >
      {bars.map((bar) => (
        <rect
          key={bar.x}
          data-intro="wake-bar"
          x={bar.x}
          y={bar.y}
          width="1.4"
          height={bar.h}
          rx="0.5"
        />
      ))}
    </svg>
  );
}
