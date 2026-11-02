import { HudCornerBracket } from "@/components/ui/HudCornerBracket";

/**
 * Quatre équerres HUD — chrome partagé (modale, CTA frame).
 * Pas de fond : le parent pose surface / transparence.
 */
export function HudFrameBrackets() {
  return (
    <>
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
    </>
  );
}
