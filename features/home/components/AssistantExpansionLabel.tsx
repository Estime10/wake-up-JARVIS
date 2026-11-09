"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type AssistantExpansionLabelProps = {
  visible: boolean;
};

/**
 * Libellé « Estime Logiciel Système Assistant » — milieu vertical
 * exact entre le bas du mark (stage) et le haut du composer.
 *
 * `top` est écrit en DOM (pas via setState) pour éviter un re-render / flash
 * à chaque tick ResizeObserver pendant le settle GSAP du composer.
 */
export function AssistantExpansionLabel({
  visible,
}: AssistantExpansionLabelProps) {
  const labelRef = useRef<HTMLParagraphElement | null>(null);
  const lastTopRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const label = labelRef.current;
    const column = label?.parentElement;
    if (!label || !column) {
      return;
    }

    const applyTop = (next: number) => {
      const prev = lastTopRef.current;
      if (prev !== null && Math.abs(prev - next) < 0.5) {
        return;
      }
      lastTopRef.current = next;
      label.style.top = `${next}px`;
      if (!readyRef.current) {
        readyRef.current = true;
        setReady(true);
      }
    };

    const measure = () => {
      const stage = column.querySelector<HTMLElement>(
        '[data-home="assistant-stage"]',
      );
      const composer = column.querySelector<HTMLElement>(
        '[data-home="composer"]',
      );
      if (!stage || !composer) {
        return;
      }

      const colTop = column.getBoundingClientRect().top;
      const stageBottom = stage.getBoundingClientRect().bottom - colTop;
      const composerTop = composer.getBoundingClientRect().top - colTop;
      if (composerTop <= stageBottom) {
        return;
      }

      applyTop((stageBottom + composerTop) / 2);
    };

    const schedule = () => {
      if (rafRef.current !== null) {
        return;
      }
      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null;
        measure();
      });
    };

    measure();

    const ro = new ResizeObserver(schedule);
    ro.observe(column);
    const stage = column.querySelector('[data-home="assistant-stage"]');
    const composer = column.querySelector('[data-home="composer"]');
    if (stage) {
      ro.observe(stage);
    }
    if (composer) {
      ro.observe(composer);
    }

    window.addEventListener("resize", schedule);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  return (
    <p
      ref={labelRef}
      data-home="assistant-expansion"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 -translate-y-1/2 px-2 text-center t-mono text-dial tracking-[0.18em] text-text uppercase sm:text-sm",
        (!visible || !ready) && "opacity-0",
      )}
      aria-hidden={!visible || !ready || undefined}
    >
      {t("app.expansion")}
    </p>
  );
}
