"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

import { JarvisMark } from "@/components/ui/JarvisMark";
import { placeOnRect } from "@/features/jarvis/model/enterBoundsMotion";
import {
  hasPendingHomeEnter,
  onHomeEnterComplete,
} from "@/features/jarvis/model/homeEnterHandoff";
import { MARK_DOM, queryMarkSlot } from "@/features/jarvis/model/markDom";
import { startDialIdleSpin } from "@/features/jarvis/model/startDialIdleSpin";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

gsap.registerPlugin(useGSAP);

function isHomePath(pathname: string): boolean {
  return pathname === "/home" || pathname.startsWith("/home/");
}

/**
 * Unique mark de session — ne snappe jamais home tant que phase splash
 * (la timeline enter gère le scale-down).
 */
export function PersistentMark() {
  const pathname = usePathname();
  const markRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef<"home" | "splash" | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const home = isHomePath(pathname);

  useLayoutEffect(() => {
    const mark = markRef.current;
    if (!mark) {
      return;
    }

    gsap.set(mark, {
      position: "fixed",
      margin: 0,
      x: 0,
      y: 0,
      maxWidth: "none",
      zIndex: 60,
      pointerEvents: "none",
    });

    // Depuis splash : ne pas toucher top/size — la timeline enter gère le scale-down.
    if (home && phaseRef.current === "splash") {
      gsap.set(mark, { opacity: 1 });

      if (hasPendingHomeEnter()) {
        return onHomeEnterComplete(() => {
          phaseRef.current = "home";
        });
      }

      phaseRef.current = "home";
      return undefined;
    }

    const slotName = home ? "home" : "splash";
    const slot = queryMarkSlot(slotName);
    if (!slot) {
      return;
    }

    placeOnRect(mark, slot.getBoundingClientRect());
    if (home) {
      gsap.set(mark, { opacity: 1 });
    }
    phaseRef.current = slotName;

    return undefined;
  }, [home, pathname, reducedMotion]);

  useGSAP(
    () => {
      if (!home || reducedMotion) {
        return;
      }
      const dial = markRef.current?.querySelector<SVGGeometryElement>(
        MARK_DOM.ringDial,
      );
      if (!dial) {
        return;
      }
      startDialIdleSpin(dial);
    },
    {
      scope: markRef,
      dependencies: [home, reducedMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={markRef}
      data-intro="mark"
      data-jarvis-mark="ring"
      className="pointer-events-none fixed z-[60] text-accent"
      aria-hidden
    >
      <JarvisMark className="size-full" />
    </div>
  );
}
