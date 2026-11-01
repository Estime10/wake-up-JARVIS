"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, type ReactNode } from "react";

import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { t } from "@/lib/i18n";

gsap.registerPlugin(useGSAP);

type AppShellProps = {
  children: ReactNode;
  side: ReactNode;
};

const OPEN_COLUMNS = "minmax(0,75%) minmax(0,25%)";
const CLOSED_COLUMNS = "minmax(0,100%) minmax(0,0%)";

/**
 * Coquille `(main)` — 75/25.
 * À l'arrivée : le panneau droit s'ouvre en slide smooth.
 */
export function AppShell({ children, side }: AppShellProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const sideRef = useRef<HTMLElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      const shell = shellRef.current;
      const aside = sideRef.current;
      if (!shell || !aside) {
        return;
      }

      if (reducedMotion) {
        gsap.set(shell, { gridTemplateColumns: OPEN_COLUMNS });
        gsap.set(aside, { x: 0, clearProps: "transform" });
        return;
      }

      gsap.set(shell, { gridTemplateColumns: CLOSED_COLUMNS });
      gsap.set(aside, { xPercent: 100 });

      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      tl.to(shell, { gridTemplateColumns: OPEN_COLUMNS, duration: 0.75 }, 0);
      tl.to(aside, { xPercent: 0, duration: 0.75 }, 0);
    },
    { scope: shellRef, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return (
    <div
      ref={shellRef}
      className="grid h-dvh w-full overflow-hidden bg-bg text-text"
      style={{ gridTemplateColumns: OPEN_COLUMNS }}
    >
      <section className="relative min-h-0 min-w-0">{children}</section>
      <aside
        ref={sideRef}
        className="relative flex min-h-0 min-w-0 flex-col border-l border-line-subtle will-change-transform"
        aria-label={t("home.sidePanelLabel")}
      >
        {side}
      </aside>
    </div>
  );
}
