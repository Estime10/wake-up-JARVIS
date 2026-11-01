/**
 * Calque fixe vignette + scanlines (DA ≤ 4 %).
 * Décoratif — toujours `aria-hidden`, jamais d'interaction.
 */
export function HudAmbient() {
  return (
    <div
      className="hud-ambient pointer-events-none absolute inset-0 z-0"
      aria-hidden
    />
  );
}
