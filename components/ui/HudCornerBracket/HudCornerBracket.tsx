import {
  HUD_CORNER_CLASS,
  type HudCorner,
} from "@/components/ui/HudCornerBracket/hudCornerBracketVariants";
import { cn } from "@/lib/cn";

type HudCornerBracketProps = {
  corner: HudCorner;
  className?: string;
};

/** Équerre HUD — L en bordure (coins de cadre). Visuel pur. */
export function HudCornerBracket({ corner, className }: HudCornerBracketProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute size-5 border-accent/40 sm:size-6",
        HUD_CORNER_CLASS[corner],
        className,
      )}
      aria-hidden
    />
  );
}
