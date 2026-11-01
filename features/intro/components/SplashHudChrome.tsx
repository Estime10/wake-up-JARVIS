"use client";

import { useInboxMailCount } from "@/features/intro/hooks/useInboxMailCount";
import { useIntroClock } from "@/features/intro/hooks/useIntroClock";
import { useLocalTemperature } from "@/features/intro/hooks/useLocalTemperature";
import { t } from "@/lib/i18n";

/** Méta HUD coins — décoratif uniquement (maquette 01-intro). */
export function SplashHudChrome() {
  const clock = useIntroClock();
  const mailCount = useInboxMailCount();
  const temperature = useLocalTemperature();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 text-text-muted"
      aria-hidden
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

      <div className="absolute bottom-6 left-1/2 flex max-w-[min(90vw,28rem)] -translate-x-1/2 items-center gap-2 sm:bottom-8">
        <WakeIcon />
        <p className="t-mono truncate text-xs sm:text-sm">
          {t("intro.wakeDetected", { phrase: t("intro.wakePhrase") })}
        </p>
      </div>

      <div className="absolute right-6 bottom-6 sm:right-8 sm:bottom-8">
        <p className="t-mono text-xs sm:text-sm">{t("intro.sysNominal")}</p>
      </div>
    </div>
  );
}

function WakeIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 text-text-muted sm:size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
    >
      <path d="M3 6.5v3M5.5 4.5v7M8 3v10M10.5 5v6M13 6.5v3" />
    </svg>
  );
}
