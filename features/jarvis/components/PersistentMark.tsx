"use client";

import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

import { JarvisMark } from "@/components/ui/JarvisMark";
import { useJarvisShell } from "@/features/jarvis/context";
import {
  FLIP_ID,
  queryMarkSlot,
  type MarkSlotName,
} from "@/features/jarvis/model/markDom";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { ROUTES } from "@/lib/routes";

function isHomePath(pathname: string): boolean {
  return pathname === ROUTES.home || pathname.startsWith(`${ROUTES.home}/`);
}

function placeMarkOnSlot(
  mark: HTMLElement,
  slotName: MarkSlotName,
  opts?: { visible?: boolean },
): boolean {
  const slot = queryMarkSlot(mark.ownerDocument, slotName);
  if (!slot) {
    return false;
  }
  placeOnRect(mark, slot.getBoundingClientRect());
  if (opts?.visible) {
    showMark(mark);
  }
  return true;
}

/**
 * Unique mark de session — toujours le même nœud DOM (fixed).
 * Dessin = splash (JarvisMark v2 + chrome boot).
 */
export function PersistentMark() {
  const pathname = usePathname();
  const { markRef, handoff } = useJarvisShell();
  const phaseRef = useRef<"home" | "splash" | null>(null);
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
      zIndex: 30,
      pointerEvents: "none",
    });

    if (home && handoff.hasPending()) {
      // Déjà posé au capture splash — Flip géré par playHomeBriefingHold.
      phaseRef.current = "home";
      showMark(mark);
      mark.style.visibility = "";
      return handoff.onComplete(() => {
        placeMarkOnSlot(mark, "home", { visible: true });
      });
    }

    if (home && phaseRef.current === "splash") {
      phaseRef.current = "home";
      placeMarkOnSlot(mark, "home", { visible: true });
      return undefined;
    }

    if (home) {
      phaseRef.current = "home";
      return undefined;
    }

    phaseRef.current = "splash";
    gsap.set(mark, { opacity: 0, visibility: "hidden" });
    return undefined;
  }, [handoff, home, markRef, pathname]);

  return (
    <div
      ref={markRef}
      data-intro="mark"
      data-jarvis-mark="ring"
      data-flip-id={FLIP_ID.mark}
      className="pointer-events-none fixed z-30 overflow-visible text-accent opacity-0"
      aria-hidden
    >
      <JarvisMark className="size-full overflow-visible" />
    </div>
  );
}
