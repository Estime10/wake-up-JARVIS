import {
  HUD_OVERLAY_MOTION_CLASS,
  HUD_OVERLAY_SURFACE_CLASS,
} from "@/features/home/model/hudOverlay";
import { cn } from "@/lib/cn";

type HudOverlayProps = {
  visible: boolean;
  className?: string;
};

/**
 * Dim + blur identique pour terminal et GitHub — un seul nœud DOM.
 */
export function HudOverlay({ visible, className }: HudOverlayProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0",
        HUD_OVERLAY_SURFACE_CLASS,
        HUD_OVERLAY_MOTION_CLASS,
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
      aria-hidden
    />
  );
}
