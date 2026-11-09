"use client";

import {
  HUD_OVERLAY_MOTION_CLASS,
  HUD_OVERLAY_SURFACE_CLASS,
} from "@/features/home/model/hudOverlay";
import {
  mainSectionBoxStyle,
  useMainSectionBox,
} from "@/features/home/hooks/useMainSectionBox";
import { cn } from "@/lib/cn";

type HudOverlayProps = {
  visible: boolean;
  className?: string;
};

/**
 * Dim + blur borné à la colonne `main` — terminal et GitHub.
 */
export function HudOverlay({ visible, className }: HudOverlayProps) {
  const box = useMainSectionBox(visible);

  return (
    <div
      className={cn(
        "pointer-events-none fixed",
        HUD_OVERLAY_SURFACE_CLASS,
        HUD_OVERLAY_MOTION_CLASS,
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
      style={mainSectionBoxStyle(box)}
      aria-hidden
    />
  );
}
