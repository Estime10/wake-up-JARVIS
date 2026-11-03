"use client";

import { useEffect } from "react";

function isScrollAllowed(event: Event): boolean {
  return event
    .composedPath()
    .some(
      (node) =>
        node instanceof HTMLElement && node.dataset.scrollLockAllow === "true",
    );
}

/**
 * Bloque le scroll des surfaces marquées `data-scroll-lock-target`
 * (+ html/body) tant que `locked` est vrai.
 * Les zones `data-scroll-lock-allow="true"` restent scrollables.
 */
export function useScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked) {
      return undefined;
    }

    const html = document.documentElement;
    const body = document.body;
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-lock-target]"),
    );

    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevTargets = targets.map((el) => el.style.overflowY);

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    for (const el of targets) {
      el.style.overflowY = "hidden";
    }

    const blockWheel = (event: WheelEvent) => {
      if (!isScrollAllowed(event)) {
        event.preventDefault();
      }
    };
    const blockTouch = (event: TouchEvent) => {
      if (!isScrollAllowed(event)) {
        event.preventDefault();
      }
    };

    document.addEventListener("wheel", blockWheel, { passive: false });
    document.addEventListener("touchmove", blockTouch, { passive: false });

    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      targets.forEach((el, index) => {
        el.style.overflowY = prevTargets[index] ?? "";
      });
      document.removeEventListener("wheel", blockWheel);
      document.removeEventListener("touchmove", blockTouch);
    };
  }, [locked]);
}
