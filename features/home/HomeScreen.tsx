"use client";

import { HudAmbient } from "@/components/ui/HudAmbient";
import { JarvisMark } from "@/components/ui/JarvisMark";
import { useDialIdleSpin } from "@/features/home/hooks/useDialIdleSpin";
import { SplashGreeting } from "@/features/intro/components/SplashGreeting";
import { SplashHudChrome } from "@/features/intro/components/SplashHudChrome";
import { SplashWordmark } from "@/features/intro/components/SplashWordmark";
import { useIntroGreeting } from "@/features/intro/hooks/useIntroGreeting";

/**
 * Home — même composition que le splash en état final.
 * Seule motion : cadran pointillé antihoraire.
 */
export function HomeScreen() {
  const { scopeRef } = useDialIdleSpin();
  const greetingText = useIntroGreeting();

  return (
    <div
      ref={scopeRef}
      className="relative h-full w-full overflow-hidden bg-bg"
    >
      <HudAmbient />
      <SplashHudChrome settled />

      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-8 px-6 sm:gap-10">
        <div
          data-flip-id="ring"
          className="relative flex size-[min(72vw,22rem)] items-center justify-center text-accent sm:size-[min(52vw,28rem)]"
          aria-hidden
        >
          <JarvisMark className="size-full" />
        </div>

        <div className="flex min-h-16 flex-col items-center justify-center gap-2">
          <SplashWordmark settled />
          {greetingText ? <SplashGreeting text={greetingText} settled /> : null}
        </div>
      </div>
    </div>
  );
}
