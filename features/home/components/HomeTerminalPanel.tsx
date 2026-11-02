"use client";

import { HudModal } from "@/components/ui/HudModal";
import { TerminalShell } from "@/features/home/components/TerminalShell";
import {
  mainSectionBoxStyle,
  useMainSectionBox,
} from "@/features/home/hooks/useMainSectionBox";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type HomeTerminalPanelProps = {
  open: boolean;
};

/**
 * Terminal centré V+H dans la colonne `main` (fixed → au-dessus du dim).
 */
export function HomeTerminalPanel({ open }: HomeTerminalPanelProps) {
  const box = useMainSectionBox(open);

  return (
    <div
      className={cn(
        "pointer-events-none fixed flex items-center justify-center px-2",
        TERMINAL_LAYER_CLASS.panel,
        HUD_OVERLAY_MOTION_CLASS,
        open ? "opacity-100" : "opacity-0",
      )}
      style={mainSectionBoxStyle(box)}
      aria-hidden={!open || undefined}
    >
      <HudModal
        data-terminal-modal
        aria-label={t("home.terminalShellLabel")}
        className={cn(
          "flex h-[min(65vh,28rem)] w-full max-w-xl flex-col",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <TerminalShell active={open} />
      </HudModal>
    </div>
  );
}
