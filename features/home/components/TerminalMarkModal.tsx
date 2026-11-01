"use client";

import type { Ref } from "react";

import { HudCornerBracket } from "@/components/ui/HudCornerBracket";
import { TerminalShell } from "@/features/home/components/TerminalShell";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

/**
 * Modale glass + équerres + shell (Last login / prompt) au-dessus du mark.
 */
export function TerminalMarkModal({
  modalRef,
  active,
}: {
  modalRef: Ref<HTMLDivElement | null>;
  active: boolean;
}) {
  return (
    <div
      ref={modalRef}
      data-terminal-modal
      role="dialog"
      aria-modal="true"
      aria-label={t("home.terminalShellLabel")}
      className={cn(
        "fixed bg-surface/55 opacity-0 shadow-glass backdrop-blur-[var(--blur-glass)]",
        TERMINAL_LAYER_CLASS.modal,
      )}
    >
      <HudCornerBracket
        corner="tl"
        className="top-2 left-2 sm:top-3 sm:left-3"
      />
      <HudCornerBracket
        corner="tr"
        className="top-2 right-2 sm:top-3 sm:right-3"
      />
      <HudCornerBracket
        corner="bl"
        className="bottom-2 left-2 sm:bottom-3 sm:left-3"
      />
      <HudCornerBracket
        corner="br"
        className="right-2 bottom-2 sm:right-3 sm:bottom-3"
      />
      <TerminalShell active={active} />
    </div>
  );
}
