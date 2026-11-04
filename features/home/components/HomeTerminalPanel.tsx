"use client";

import { HudModal } from "@/components/ui/HudModal";
import { TerminalShell } from "@/features/home/components/TerminalShell";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { HOME_LEFT_SECTION_WIDTH_CLASS } from "@/features/home/model/homeColumnLayout";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type HomeTerminalPanelProps = {
  open: boolean;
};

/**
 * Modale terminal — bornée à la section gauche (1/3), centrée verticalement.
 * Pas plein hauteur : hauteur modale classique dans la colonne.
 */
export function HomeTerminalPanel({ open }: HomeTerminalPanelProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-y-0 left-0 flex items-center justify-center px-3",
        HOME_LEFT_SECTION_WIDTH_CLASS,
        TERMINAL_LAYER_CLASS.panel,
        HUD_OVERLAY_MOTION_CLASS,
        open ? "opacity-100" : "opacity-0",
      )}
      aria-hidden={!open || undefined}
    >
      <HudModal
        data-terminal-modal
        data-scroll-lock-allow="true"
        aria-label={t("home.terminalShellLabel")}
        className={cn(
          "flex h-[min(65vh,28rem)] w-full max-w-none flex-col",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <TerminalShell active={open} />
      </HudModal>
    </div>
  );
}
