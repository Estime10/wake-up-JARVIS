import type { ReactNode, Ref } from "react";

import { HudAmbient } from "@/components/ui/HudAmbient";

type SplashBackdropProps = {
  children: ReactNode;
  scopeRef: Ref<HTMLDivElement>;
};

/** Calque plein écran — scope GSAP + chrome ambiant DA (pas de skip au clic). */
export function SplashBackdrop({ children, scopeRef }: SplashBackdropProps) {
  return (
    <div
      ref={scopeRef}
      role="presentation"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg"
    >
      <HudAmbient />
      {children}
    </div>
  );
}
