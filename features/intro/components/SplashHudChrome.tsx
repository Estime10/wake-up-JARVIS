"use client";

import { HudCornerBracket } from "@/components/ui/HudCornerBracket";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type SplashHudChromeProps = {
  /** État final visible (home). */
  settled?: boolean;
  /** Ligne « Réveil détecté » — désactivée sur home actuel. */
  showWake?: boolean;
};

/**
 * Chrome home — équerres uniquement.
 * Nav (heure + Terminal · Mail · GitHub) → `HomeNavHeader`.
 */
export function SplashHudChrome({
  settled = false,
  showWake = false,
}: SplashHudChromeProps) {
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
        <HudCornerBracket
          corner="tl"
          className="top-3 left-3 sm:top-4 sm:left-4"
        />
        <HudCornerBracket
          corner="tr"
          className="top-3 right-3 sm:top-4 sm:right-4"
        />
        <HudCornerBracket
          corner="bl"
          className="bottom-3 left-3 sm:bottom-4 sm:left-4"
        />
        <HudCornerBracket
          corner="br"
          className="right-3 bottom-3 sm:right-4 sm:bottom-4"
        />
      </div>

      {showWake ? <WakeLine settled={settled} wakeText={wakeText} /> : null}
    </div>
  );
}

function WakeLine({
  settled,
  wakeText,
}: {
  settled: boolean;
  wakeText: string;
}) {
  return (
    <div className="absolute bottom-6 left-1/2 flex max-w-[min(90vw,28rem)] -translate-x-1/2 items-center gap-2 sm:bottom-8">
      <WakeIcon settled={settled} />
      <p className="t-mono truncate text-dial sm:text-sm">
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
        "size-3.5 shrink-0 origin-center text-accent sm:size-4",
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
