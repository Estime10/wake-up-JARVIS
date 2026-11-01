"use client";

import type { Ref } from "react";

import { Button } from "@/components/ui/Button";
import { HudCornerBracket } from "@/components/ui/HudCornerBracket";
import { useInboxMailCount } from "@/features/intro/hooks/useInboxMailCount";
import { useIntroClock } from "@/features/intro/hooks/useIntroClock";
import { cn } from "@/lib/cn";
import { useDeviceLocation } from "@/lib/hooks/useDeviceLocation";
import { t } from "@/lib/i18n";

type SplashHudChromeProps = {
  /** État final visible (home) — pas d'opacité 0 pour GSAP intro. */
  settled?: boolean;
  /** Ligne « Réveil détecté » — intro seulement. */
  showWake?: boolean;
  /** Terminal ouvert — CTA « Close Terminal ». */
  terminalOpen?: boolean;
  terminalTriggerRef?: Ref<HTMLButtonElement | null>;
  onTerminalClick?: () => void;
};

/** Méta HUD — intro (targets GSAP) ou home figé (`settled`). */
export function SplashHudChrome({
  settled = false,
  showWake = true,
  terminalOpen = false,
  terminalTriggerRef,
  onTerminalClick,
}: SplashHudChromeProps) {
  const clock = useIntroClock();
  const mailCount = useInboxMailCount();
  const location = useDeviceLocation();
  const wakeText = t("intro.wakeDetected", { phrase: t("intro.wakePhrase") });

  return (
    <>
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

        <div
          data-intro="hud-corners"
          className={cn("absolute inset-0", !settled && "opacity-0")}
        >
          <div className="absolute top-6 left-6 flex flex-col gap-1 sm:top-8 sm:left-8">
            <p className="t-mono text-dial sm:text-sm" suppressHydrationWarning>
              {location.coords}
            </p>
            <p className="t-mono text-dial sm:text-sm" suppressHydrationWarning>
              {location.place}
            </p>
          </div>

          <div className="absolute top-6 right-6 flex flex-col items-end gap-1 sm:top-8 sm:right-8">
            <p className="t-mono text-dial sm:text-sm">
              {t("intro.mailTotal", { count: mailCount })}
            </p>
            {/* Emplacement réservé — CTA réel hors aria-hidden */}
            <span
              className="invisible t-mono text-dial uppercase sm:text-sm"
              aria-hidden
            >
              {terminalOpen ? t("home.terminalClose") : t("home.terminal")}
            </span>
          </div>

          <div className="absolute bottom-6 left-6 sm:bottom-8 sm:left-8">
            <p className="t-mono text-dial sm:text-sm" suppressHydrationWarning>
              {clock}
            </p>
          </div>

          <div className="absolute right-6 bottom-6 sm:right-8 sm:bottom-8">
            <p className="t-mono text-dial text-success uppercase sm:text-sm">
              {t("intro.sysNominal")}
            </p>
          </div>
        </div>

        {showWake ? (
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
        ) : null}
      </div>

      <div
        className={cn(
          "absolute top-6 right-6 z-20 flex flex-col items-end gap-1 sm:top-8 sm:right-8",
          !settled && "opacity-0",
        )}
      >
        {/* Spacer aligné sur le compteur mails (décor) */}
        <span className="invisible t-mono text-dial sm:text-sm" aria-hidden>
          {t("intro.mailTotal", { count: mailCount })}
        </span>
        <Button
          ref={terminalTriggerRef}
          variant="hud"
          size="bare"
          aria-expanded={terminalOpen}
          aria-label={
            terminalOpen
              ? t("home.terminalCloseLabel")
              : t("home.terminalLabel")
          }
          onClick={onTerminalClick}
        >
          {terminalOpen ? t("home.terminalClose") : t("home.terminal")}
        </Button>
      </div>
    </>
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
