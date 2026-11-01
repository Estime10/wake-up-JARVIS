"use client";

import { useRef } from "react";

import { HudAmbient } from "@/components/ui/HudAmbient";
import { HomeComposer } from "@/features/home/components/HomeComposer";
import { useHomeChromeReveal } from "@/features/home/hooks/useHomeChromeReveal";
import { MarkSlot } from "@/features/jarvis/components/MarkSlot";
import { SplashGreeting } from "@/features/intro/components/SplashGreeting";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { useIntroGreeting } from "@/features/intro/hooks/useIntroGreeting";

/**
 * Home — chrome HUD en fade-in après la fin de l’enter motion.
 */
export function HomeScreen() {
  const greetingText = useIntroGreeting();
  const chromeRef = useRef<HTMLDivElement | null>(null);
  useHomeChromeReveal(chromeRef);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg">
      <HudAmbient />

      <div
        ref={chromeRef}
        className="pointer-events-none absolute inset-0 opacity-0"
      >
        <SplashHudChrome settled showWake={false} />
      </div>

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center px-6 pt-12 sm:pt-14">
          <MarkSlot
            name="home"
            className="size-[min(54vw,17rem)] sm:size-[min(38vw,18.5rem)]"
          />

          <div className="mt-5 flex min-h-16 flex-col items-center justify-center gap-2">
            <SplashWordmark settled />
            <SplashGreeting text={greetingText} settled />
          </div>

          <div
            data-home="composer"
            className="mt-auto mb-16 flex w-full justify-center sm:mb-20"
          >
            <HomeComposer />
          </div>
        </div>
      </div>
    </div>
  );
}
