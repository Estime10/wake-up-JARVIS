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
  // Slots rendus par les routes (hors sous-arbre du mark) : scope = document.
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
 * `opacity-0` CSS par défaut : jamais de flash top-left avant placeOnRect.
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
      zIndex: 60,
      pointerEvents: "none",
    });

    if (home && handoff.hasPending()) {
      showMark(mark);
      return handoff.onComplete(() => {
        phaseRef.current = "home";
        placeMarkOnSlot(mark, "home", { visible: true });
      });
    }

    if (home && phaseRef.current === "splash") {
      phaseRef.current = "home";
      placeMarkOnSlot(mark, "home", { visible: true });
      return undefined;
    }

    // Refresh /home : ne pas poser ici — `playHomeDirectEnter` mesure le slot
    // après layout panneau et révèle (évite flash gauche → centre).
    if (home) {
      phaseRef.current = "home";
      return undefined;
    }

    // Splash : ne pas forcer opacity — la timeline GSAP gère l’apparition.
    const placed = placeMarkOnSlot(mark, "splash");
    if (placed) {
      phaseRef.current = "splash";
    }
    return undefined;
  }, [handoff, home, markRef, pathname]);

  return (
    <div
      ref={markRef}
      data-intro="mark"
      data-jarvis-mark="ring"
      data-flip-id={FLIP_ID.mark}
      className="pointer-events-none fixed z-[60] text-accent opacity-0"
      aria-hidden
    >
      <JarvisMark className="size-full" />
    </div>
  );
}
