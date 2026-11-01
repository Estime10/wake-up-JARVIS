"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { beginHomeEnterSession } from "@/features/jarvis/model/homeEnterHandoff";
import { SplashScreen } from "@/features/intro/components/SplashScreen";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

/**
 * Point d'entrée `/` — intro puis handoff fluide vers `/home`.
 */
export function SplashEntry() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  const onComplete = useCallback(() => {
    if (!reducedMotion) {
      beginHomeEnterSession();
    }
    router.replace("/home");
  }, [reducedMotion, router]);

  return (
    <div className="relative min-h-dvh bg-bg text-text">
      <SplashScreen mode="full" onComplete={onComplete} />
    </div>
  );
}
