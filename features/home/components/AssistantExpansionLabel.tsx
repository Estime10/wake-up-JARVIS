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
 */
export function AssistantExpansionLabel({
  visible,
}: AssistantExpansionLabelProps) {
  const labelRef = useRef<HTMLParagraphElement | null>(null);
  const [topPx, setTopPx] = useState<number | null>(null);

  useLayoutEffect(() => {
    const label = labelRef.current;
    const column = label?.parentElement;
    if (!label || !column) return;

    const sync = () => {
      const stage = column.querySelector<HTMLElement>(
        '[data-home="assistant-stage"]',
      );
      const composer = column.querySelector<HTMLElement>(
        '[data-home="composer"]',
      );
      if (!stage || !composer) return;

      const colTop = column.getBoundingClientRect().top;
      const stageBottom = stage.getBoundingClientRect().bottom - colTop;
      const composerTop = composer.getBoundingClientRect().top - colTop;
      if (composerTop <= stageBottom) return;

      setTopPx((stageBottom + composerTop) / 2);
    };

    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(column);
    const stage = column.querySelector('[data-home="assistant-stage"]');
    const composer = column.querySelector('[data-home="composer"]');
    if (stage) ro.observe(stage);
    if (composer) ro.observe(composer);

    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [visible]);

  return (
    <p
      ref={labelRef}
      data-home="assistant-expansion"
      className={cn(
        "pointer-events-none absolute inset-x-0 z-10 -translate-y-1/2 px-2 text-center t-mono text-dial tracking-[0.18em] text-text-muted uppercase sm:text-sm",
        (!visible || topPx === null) && "opacity-0",
      )}
      style={topPx === null ? undefined : { top: topPx }}
      aria-hidden={!visible || undefined}
    >
      {t("app.expansion")}
    </p>
  );
}
