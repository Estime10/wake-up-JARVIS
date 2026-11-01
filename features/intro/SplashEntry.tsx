"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

import { SplashScreen } from "@/features/intro/components/SplashScreen";
import { useJarvisShell } from "@/features/jarvis/jarvisShellContext";
import { captureSplashSnapshot } from "@/features/jarvis/model/homeEnterHandoff";
import { prefersReducedMotion } from "@/lib/motion/reducedMotion";
import { ROUTES } from "@/lib/routes";

/**
 * Point d'entrée `/` — intro puis handoff fluide vers `/home`.
 */
export function SplashEntry() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { markRef, handoff, mainFocus } = useJarvisShell();

  const onComplete = useCallback(() => {
    // Lu au moment du handoff (valeur réelle, jamais la valeur serveur).
    const root = rootRef.current;
    if (root && !prefersReducedMotion()) {
      handoff.begin(captureSplashSnapshot(markRef.current, root));
    }
    mainFocus.request();
    router.replace(ROUTES.home);
  }, [handoff, mainFocus, markRef, router]);

  return (
    <div ref={rootRef} className="relative min-h-dvh bg-bg text-text">
      <SplashScreen mode="full" onComplete={onComplete} />
    </div>
  );
}
