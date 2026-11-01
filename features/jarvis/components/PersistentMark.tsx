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
import {
  MARK_DOM,
  queryMarkSlot,
  type MarkSlotName,
} from "@/features/jarvis/model/markDom";
import { startDialIdleSpin } from "@/features/jarvis/model/startDialIdleSpin";
import { cn } from "@/lib/cn";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";

gsap.registerPlugin(useGSAP);

function isHomePath(pathname: string): boolean {
  return pathname === "/home" || pathname.startsWith("/home/");
}

function placeMarkOnSlot(
  mark: HTMLElement,
  slotName: MarkSlotName,
  opts?: { opacity?: number },
): boolean {
  const slot = queryMarkSlot(slotName);
  if (!slot) {
    return false;
  }
  placeOnRect(mark, slot.getBoundingClientRect());
  if (opts?.opacity !== undefined) {
    gsap.set(mark, { opacity: opts.opacity });
  }
  return true;
}

/**
 * Unique mark de session — toujours le même nœud DOM (fixed).
 * Pas de portal (remount = timeline intro cassée).
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

    if (home && hasPendingHomeEnter()) {
      gsap.set(mark, { opacity: 1 });
      return onHomeEnterComplete(() => {
        phaseRef.current = "home";
        placeMarkOnSlot(mark, "home", { opacity: 1 });
      });
    }

    if (home && phaseRef.current === "splash") {
      phaseRef.current = "home";
      placeMarkOnSlot(mark, "home", { opacity: 1 });
      return undefined;
    }

    const slotName: MarkSlotName = home ? "home" : "splash";
    // Splash : ne pas forcer opacity — la timeline GSAP gère l’apparition.
    const placed = placeMarkOnSlot(
      mark,
      slotName,
      home ? { opacity: 1 } : undefined,
    );
    if (placed) {
      phaseRef.current = slotName;
    }
    return undefined;
  }, [home, pathname]);

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
      className={cn(
        "pointer-events-none fixed z-[60] text-accent",
        !home && "opacity-0",
      )}
      aria-hidden
    >
      <JarvisMark className="size-full" />
    </div>
  );
}
