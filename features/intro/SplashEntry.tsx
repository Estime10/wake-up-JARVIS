"use client";

import { SplashScreen } from "@/features/intro/components/SplashScreen";

/**
 * Point d'entrée temporaire de `/` tant que MainScreen n'existe pas.
 * Le splash reste affiché après la timeline (revue visuelle).
 */
export function SplashEntry() {
  return (
    <div className="relative min-h-dvh bg-bg text-text">
      <main className="min-h-dvh" aria-hidden>
        {/* Placeholder sous le splash — MainScreen plus tard. */}
      </main>
      <SplashScreen mode="full" onComplete={() => {}} />
    </div>
  );
}
