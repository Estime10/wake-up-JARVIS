"use client";

import { HudModal } from "@/components/layout/HudModal/HudModal";
import { TerminalShell } from "@/features/home/components/ui/terminal/TerminalShell";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n/t";

type HomeTerminalPanelProps = {
  open: boolean;
};

/**
 * Terminal — même cadre que le liquid glass messages (`side-left`).
 * Absolute inset-0 dans le panneau parent.
 */
export function HomeTerminalPanel({ open }: HomeTerminalPanelProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0",
        TERMINAL_LAYER_CLASS.panel,
        HUD_OVERLAY_MOTION_CLASS,
        open ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!open || undefined}
    >
      <HudModal
        surface="plain"
        data-terminal-modal
        data-scroll-lock-allow="true"
        aria-label={t("home.terminalShellLabel")}
        className={cn(
          "flex h-full w-full max-w-none flex-col",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <TerminalShell active={open} />
      </HudModal>
    </div>
  );
}
