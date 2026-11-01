"use client";

import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import { TERMINAL_MODAL_PAD } from "@/features/home/model/terminal/modalPad";
import { useJarvisShell } from "@/features/jarvis/jarvisShellContext";
import { inflateRect } from "@/features/jarvis/model/inflateRect";
import { queryMarkSlot } from "@/features/jarvis/model/markDom";
import { placeOnRect } from "@/features/jarvis/model/markPlacement";
import { TERMINAL_EXPAND_SECONDS } from "@/lib/intro/timings";
import { prefersReducedMotion } from "@/lib/motion/reducedMotion";

const EXPAND_EASE = "power2.inOut";

type UseTerminalMarkExpandArgs = {
  open: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  /** Après shrink mark + fade modale — puis révéler l'UI home. */
  onCloseComplete?: () => void;
};

type RectTarget = Pick<DOMRectReadOnly, "top" | "left" | "width" | "height">;

function syncModalToMark(modal: HTMLElement | null, markEl: HTMLElement): void {
  if (!modal) {
    return;
  }
  placeOnRect(
    modal,
    inflateRect(markEl.getBoundingClientRect(), TERMINAL_MODAL_PAD),
  );
}

function tweenMarkTo(to: RectTarget, onUpdate: () => void) {
  return {
    top: to.top,
    left: to.left,
    width: to.width,
    height: to.height,
    duration: TERMINAL_EXPAND_SECONDS,
    ease: EXPAND_EASE,
    onUpdate,
  };
}

/**
 * Mode terminal : mark + modale glass synchronisés.
 * Fermeture : mark → home + modale fade, puis `onCloseComplete` (UI ensuite).
 */
export function useTerminalMarkExpand({
  open,
  modalRef,
  onCloseComplete,
}: UseTerminalMarkExpandArgs): void {
  const { markRef } = useJarvisShell();
  const wasOpenRef = useRef(false);
  const onCloseCompleteRef = useRef(onCloseComplete);

  useEffect(() => {
    onCloseCompleteRef.current = onCloseComplete;
  }, [onCloseComplete]);

  useLayoutEffect(() => {
    const markNode = markRef.current;
    if (!markNode) {
      return;
    }
    const markEl: HTMLElement = markNode;
    const modal = modalRef.current;

    if (!open) {
      if (!wasOpenRef.current) {
        return;
      }
      const home = queryMarkSlot(document, "home");

      function finishClose(): void {
        wasOpenRef.current = false;
        onCloseCompleteRef.current?.();
      }

      if (!home) {
        finishClose();
        return;
      }
      const to = home.getBoundingClientRect();

      if (prefersReducedMotion()) {
        placeOnRect(markEl, to);
        if (modal) {
          gsap.set(modal, { opacity: 0 });
        }
        finishClose();
        return;
      }

      const tl = gsap.timeline({
        defaults: { overwrite: "auto" },
        onComplete: finishClose,
      });

      tl.to(
        markEl,
        tweenMarkTo(to, () => syncModalToMark(modal, markEl)),
        0,
      );

      if (modal) {
        tl.to(
          modal,
          {
            opacity: 0,
            duration: TERMINAL_EXPAND_SECONDS,
            ease: EXPAND_EASE,
          },
          0,
        );
      }

      return () => {
        tl.kill();
      };
    }

    wasOpenRef.current = true;
    const slot = queryMarkSlot(document, "terminal");
    if (!slot) {
      return;
    }

    const to = slot.getBoundingClientRect();
    const from = markEl.getBoundingClientRect();

    if (prefersReducedMotion()) {
      placeOnRect(markEl, to);
      syncModalToMark(modal, markEl);
      if (modal) {
        gsap.set(modal, { opacity: 1 });
      }
      return;
    }

    if (modal) {
      placeOnRect(modal, inflateRect(from, TERMINAL_MODAL_PAD));
      gsap.set(modal, { opacity: 0, scale: 1, x: 0, y: 0 });
    }

    const tl = gsap.timeline({ defaults: { overwrite: "auto" } });

    tl.to(
      markEl,
      tweenMarkTo(to, () => syncModalToMark(modal, markEl)),
      0,
    );

    if (modal) {
      tl.to(
        modal,
        {
          opacity: 1,
          duration: TERMINAL_EXPAND_SECONDS,
          ease: EXPAND_EASE,
        },
        0,
      );
    }

    return () => {
      tl.kill();
    };
  }, [markRef, modalRef, open]);
}
