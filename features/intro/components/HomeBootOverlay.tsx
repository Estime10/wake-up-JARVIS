"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";

import { playHomeBootTimeline } from "@/features/intro/model/playHomeBootTimeline";
import { useJarvisShell } from "@/features/jarvis/context";
import { queryMarkSlot } from "@/features/jarvis/model/markDom";
import { placeOnRect, showMark } from "@/features/jarvis/model/markPlacement";
import { MARK_SLOT_SIZE } from "@/features/jarvis/model/markSlotSizes";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/cn";

gsap.registerPlugin(useGSAP);

type HomeBootOverlayProps = {
  onFinished: () => void;
};

/**
 * Boot home : page home visible (mark + équerres), on ajoute seulement
 * le scan + le nom JARVIS. Pas de SVG splash assemblé (équerres/mark différents).
 */
export function HomeBootOverlay({ onFinished }: HomeBootOverlayProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { markRef } = useJarvisShell();
  const finishedRef = useRef(false);

  // Même JarvisMark, collé au slot home dès le boot.
  useEffect(() => {
    const mark = markRef.current;
    if (!mark) {
      return undefined;
    }

    const place = () => {
      const slot =
        queryMarkSlot(document, "home") ?? queryMarkSlot(document, "splash");
      if (!slot) {
        return false;
      }
      placeOnRect(mark, slot.getBoundingClientRect());
      mark.style.visibility = "visible";
      mark.style.pointerEvents = "none";
      mark.style.zIndex = "30";
      showMark(mark);
      gsap.set(mark, { opacity: 1, clearProps: "transform" });
      return true;
    };

    let raf = 0;
    const tick = () => {
      if (!place()) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    tick();
    window.addEventListener("resize", place);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", place);
    };
  }, [markRef]);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || finishedRef.current) {
        return undefined;
      }
      return playHomeBootTimeline({
        root,
        onComplete: () => {
          if (finishedRef.current) {
            return;
          }
          finishedRef.current = true;
          onFinished();
        },
      });
    },
    { scope: rootRef, dependencies: [onFinished] },
  );

  const label = t("intro.wordmark");
  const letters = Array.from(label);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-[60] text-accent"
      aria-hidden
    >
      {/* Scan — bande + ligne, indépendant du SVG splash. */}
      <div
        data-boot-scan
        className="absolute inset-x-0 top-0 h-[12vh] min-h-16 will-change-transform"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, color-mix(in oklab, currentColor 6%, transparent) 70%, transparent 100%)",
          boxShadow:
            "0 1px 0 color-mix(in oklab, currentColor 32%, transparent)",
        }}
      />

      {/* Nom sous le mark home — un cran plus bas que le slot. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className={cn("shrink-0", MARK_SLOT_SIZE.splash)} aria-hidden />
        <div className="h-20 w-full shrink-0 sm:h-24" aria-hidden />
        <p
          data-boot-wordmark
          className="t-wordmark text-wordmark-display mt-[calc(2.5rem+55px)] text-center text-text sm:mt-[calc(3rem+55px)]"
        >
          {letters.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              data-boot-letter
              className="inline-block"
            >
              {letter}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
