"use client";

import { Button } from "@/components/ui/Button";
import { HudOverlay } from "@/features/home/components/HudOverlay";
import {
  mainSectionBoxStyle,
  useMainSectionBox,
} from "@/features/home/hooks/useMainSectionBox";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type TerminalBackdropProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Overlay terminal (visuel = HudOverlay) + hit transparent — zone `main` seulement.
 */
export function TerminalBackdrop({ open, onClose }: TerminalBackdropProps) {
  const box = useMainSectionBox(open);

  return (
    <>
      <HudOverlay visible={open} className={TERMINAL_LAYER_CLASS.backdrop} />
      <Button
        type="button"
        variant="ghost"
        size="bare"
        tabIndex={open ? 0 : -1}
        aria-hidden={!open || undefined}
        aria-label={t("home.terminalCloseLabel")}
        className={cn(
          "fixed block cursor-default rounded-none bg-transparent",
          TERMINAL_LAYER_CLASS.backdrop,
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        style={mainSectionBoxStyle(box)}
        onClick={onClose}
      >
        <span className="sr-only">{t("home.terminalClose")}</span>
      </Button>
    </>
  );
}
