"use client";

import { useState } from "react";

import { SplashScreen } from "@/features/intro/components/SplashScreen";
import { t } from "@/lib/i18n";

/**
 * Point d'entrée temporaire de `/` tant que MainScreen n'existe pas.
 * Orchestrateur de l'écran intro.
 */
export function SplashEntry() {
  const [introDone, setIntroDone] = useState(false);

  return (
    <div className="relative min-h-dvh bg-bg text-text">
      <main
        className="flex min-h-dvh flex-col items-center justify-center px-6"
        aria-hidden={!introDone}
      >
        {introDone ? (
          <p className="t-label text-text-muted">{t("app.systemReady")}</p>
        ) : null}
      </main>

      {!introDone ? (
        <SplashScreen mode="full" onComplete={() => setIntroDone(true)} />
      ) : null}
    </div>
  );
}
