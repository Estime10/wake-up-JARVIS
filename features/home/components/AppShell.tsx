"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { HudAmbient } from "@/components/ui/HudAmbient";
import { HomeEnterProvider } from "@/features/home/context/HomeEnterProvider";
import { useHomeEnterMotion } from "@/features/home/hooks/useHomeEnterMotion";
import { useMainFocusAfterIntro } from "@/features/home/hooks/useMainFocusAfterIntro";
import {
  MAIN_LANDMARK_ID,
  MAIN_TITLE_ID,
} from "@/features/home/model/landmarks";
import { HomeBootOverlay } from "@/features/intro/components/HomeBootOverlay";
import { useJarvisShell } from "@/features/jarvis/context";
import { cn } from "@/lib/cn";

type AppShellProps = {
  children: ReactNode;
  /** Étape 1 refonte-ui : sidebar désactivée (`null`). Conservé pour restauration. */
  side?: ReactNode | null;
  repo: ReactNode;
  /** Tiroir mails — section gauche plein cadre. */
  mail?: ReactNode;
};

/**
 * Gate boot — `"boot"` SSR (HTML stable), puis scan+nom, puis HUD/input.
 * Rejoué à chaque visite / refresh.
 */
type BootGate = "boot" | "playing" | "ready";

/**
 * Coquille `(main)` — home visible pendant le boot (même mark / équerres),
 * overlay = scan + nom JARVIS seulement.
 */
export function AppShell({ children, repo, mail }: AppShellProps) {
  const { mainFocus } = useJarvisShell();
  const [gate, setGate] = useState<BootGate>("boot");

  useEffect(() => {
    // Différé : évite setState sync dans l’effect (SSR « boot » → client « playing »).
    const id = window.requestAnimationFrame(() => {
      setGate("playing");
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const onBootFinished = useCallback(() => {
    mainFocus.request();
    setGate("ready");
  }, [mainFocus]);

  const splashDone = gate === "ready";
  const bootPlaying = gate === "playing";

  const {
    shellRef,
    sideRef,
    phase,
    briefingReady,
    beginSettle,
    skipCenteredBriefing,
  } = useHomeEnterMotion(splashDone);
  const mainRef = useMainFocusAfterIntro();

  return (
    <HomeEnterProvider
      phase={phase}
      briefingReady={briefingReady}
      beginSettle={beginSettle}
      skipCenteredBriefing={skipCenteredBriefing}
      bootPlaying={bootPlaying}
    >
      <div
        ref={shellRef}
        className="relative grid h-dvh w-full grid-cols-1 overflow-hidden bg-bg text-text"
      >
        <HudAmbient />
        {repo}
        {mail}

        {bootPlaying ? <HomeBootOverlay onFinished={onBootFinished} /> : null}

        <main
          ref={mainRef}
          id={MAIN_LANDMARK_ID}
          tabIndex={-1}
          aria-labelledby={MAIN_TITLE_ID}
          className={cn(
            "relative h-full min-h-0 w-full min-w-0 outline-none",
            // Pendant SSR boot : invisible (évite flash). Dès playing : home visible.
            gate === "boot" && "invisible",
          )}
        >
          {children}
        </main>

        {/* Étape 1 refonte-ui — sidebar (HomeSidePanel) désactivée.
            Restaurer : prop `side` + aside visible + grille 75/25. */}
        <aside ref={sideRef} className="hidden" aria-hidden="true" />
      </div>
    </HomeEnterProvider>
  );
}
