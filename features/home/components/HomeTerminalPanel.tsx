"use client";

import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import { HudModal } from "@/components/ui/HudModal";
import { TerminalShell } from "@/features/home/components/TerminalShell";
import { HUD_OVERLAY_MOTION_CLASS } from "@/features/home/model/hudOverlay";
import { TERMINAL_LAYER_CLASS } from "@/features/home/model/terminalLayers";
import { cn } from "@/lib/cn";
import { t } from "@/lib/i18n";

type HomeTerminalPanelProps = {
  open: boolean;
  /** Zone messages/input — le panneau se centre dedans (au-dessus de l’overlay). */
  anchorRef: RefObject<HTMLElement | null>;
};

type AnchorBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Terminal centré V+H dans la zone messages/input (fixed → au-dessus du dim).
 */
export function HomeTerminalPanel({ open, anchorRef }: HomeTerminalPanelProps) {
  const [box, setBox] = useState<AnchorBox | null>(null);

  useLayoutEffect(() => {
    function sync(): void {
      const anchor = anchorRef.current;
      if (!anchor) {
        return;
      }
      const rect = anchor.getBoundingClientRect();
      setBox({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }

    sync();
    if (!open) {
      return;
    }

    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [anchorRef, open]);

  const style: CSSProperties | undefined = box
    ? {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
      }
    : undefined;

  return (
    <div
      className={cn(
        "pointer-events-none fixed flex items-center justify-center px-2",
        TERMINAL_LAYER_CLASS.panel,
        HUD_OVERLAY_MOTION_CLASS,
        open ? "opacity-100" : "opacity-0",
      )}
      style={style}
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
