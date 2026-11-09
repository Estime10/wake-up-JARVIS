"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { JarvisMark } from "@/components/ui/JarvisMark";
import { useJarvisShell } from "@/features/jarvis/context";
import {
  FLIP_ID,
  queryMarkSlot,
  type MarkSlotName,
} from "@/features/jarvis/model/markDom";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { ROUTES } from "@/lib/routes";

gsap.registerPlugin(useGSAP);

function isHomePath(pathname: string): boolean {
  return pathname === ROUTES.home || pathname.startsWith(`${ROUTES.home}/`);
}

function resolveHomeSlotName(doc: Document): MarkSlotName {
  return queryMarkSlot(doc, "home") != null ? "home" : "splash";
}

/**
 * Pose fixed sur le slot — sans clearProps layout (évite le flash / « refetch »).
 * Annule seulement les offsets Flip/GSAP résiduels.
 */
function placeMarkOnSlot(
  mark: HTMLElement,
  slotName: MarkSlotName,
  opts?: { visible?: boolean },
): boolean {
  const slot = queryMarkSlot(mark.ownerDocument, slotName);
  if (!slot) {
    return false;
  }
  const rect = slot.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) {
    return false;
  }
  gsap.set(mark, { x: 0, y: 0, scale: 1, xPercent: 0, yPercent: 0 });
  placeOnRect(mark, rect);
  if (opts?.visible) {
    showMark(mark);
  }
  return true;
}

/** Suit le MarkSlot — même nœud DOM, jamais de portal / remount SVG. */
function attachSlotSync(mark: HTMLElement, slotName: MarkSlotName): () => void {
  let raf = 0;
  let lastKey = "";

  function syncToSlot(): void {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const slot = queryMarkSlot(mark.ownerDocument, slotName);
      if (!slot) {
        return;
      }
      const rect = slot.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) {
        return;
      }
      const key = `${rect.top.toFixed(1)}|${rect.left.toFixed(1)}|${rect.width.toFixed(1)}|${rect.height.toFixed(1)}`;
      if (key === lastKey) {
        return;
      }
      lastKey = key;
      gsap.set(mark, { x: 0, y: 0, scale: 1, xPercent: 0, yPercent: 0 });
      placeOnRect(mark, rect);
      showMark(mark);
      mark.style.visibility = "";
    });
  }

  syncToSlot();

  const slot = queryMarkSlot(mark.ownerDocument, slotName);
  const stage =
    slot?.closest<HTMLElement>("[data-home='assistant-stage']") ?? null;
  const column = stage?.parentElement ?? null;

  const observer = new ResizeObserver(() => {
    lastKey = "";
    syncToSlot();
  });
  if (slot) {
    observer.observe(slot);
  }
  if (stage) {
    observer.observe(stage);
  }
  if (column) {
    observer.observe(column);
  }
  window.addEventListener("resize", syncToSlot);

  const followUps = [0, 50, 150, 400].map((ms) =>
    window.setTimeout(() => {
      lastKey = "";
      syncToSlot();
    }, ms),
  );

  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    window.removeEventListener("resize", syncToSlot);
    for (const id of followUps) {
      window.clearTimeout(id);
    }
  };
}

/**
 * Unique mark de session — toujours le même nœud DOM (fixed).
 * Pas de portal : un déplacement React remontait JarvisMark et
 * relançait les spins SVG (= impression de « refetch » à l’arrivée home).
 */
export function PersistentMark() {
  const pathname = usePathname();
  const { markRef, handoff } = useJarvisShell();
  const phaseRef = useRef<"home" | "splash" | null>(null);
  const home = isHomePath(pathname);

  useGSAP(
    () => {
      const mark = markRef.current;
      if (!mark) {
        return;
      }

      gsap.set(mark, {
        position: "fixed",
        margin: 0,
        x: 0,
        y: 0,
        scale: 1,
        maxWidth: "none",
        zIndex: 30,
        pointerEvents: "none",
      });

      if (home && handoff.hasPending()) {
        phaseRef.current = "home";
        showMark(mark);
        mark.style.visibility = "";
        // Coller au slot tout de suite (skipCenteredBriefing = pas de Flip).
        // Attendre handoff.end() provoquait un saut « refetch » au settle.
        const detachSync = attachSlotSync(
          mark,
          resolveHomeSlotName(mark.ownerDocument),
        );
        const stopHandoff = handoff.onComplete(() => {
          mark.style.zIndex = "30";
        });
        return () => {
          stopHandoff();
          detachSync();
        };
      }

      if (home && phaseRef.current === "splash") {
        phaseRef.current = "home";
        placeMarkOnSlot(mark, "home", { visible: true });
      }

      if (home) {
        phaseRef.current = "home";
        return attachSlotSync(mark, resolveHomeSlotName(mark.ownerDocument));
      }

      phaseRef.current = "splash";
      gsap.set(mark, { opacity: 0, visibility: "hidden" });
      return undefined;
    },
    { dependencies: [handoff, home, markRef, pathname] },
  );

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
