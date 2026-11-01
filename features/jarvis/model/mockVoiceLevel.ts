/**
 * Niveau voix simulé (~30 Hz) — somme de sinus (déterministe, pas de
 * Math.random : même rendu à chaque passage, testable).
 * Arrêté hors écoute / parole (PLAN-UI §3.4).
 */
export function subscribeMockVoiceLevel(
  onLevel: (level: number) => void,
): () => void {
  let frame = 0;
  let raf = 0;
  let running = true;

  const tick = (time: number): void => {
    if (!running) {
      return;
    }
    frame += 1;
    if (frame % 2 === 0) {
      const wave =
        0.42 +
        0.28 * Math.sin(time / 190) +
        0.16 * Math.sin(time / 97) +
        0.12 * Math.sin(time / 53);
      // Ex-bruit aléatoire (moyenne 0.09) → harmonique rapide de même moyenne.
      const flutter = 0.09 + 0.09 * Math.sin(time / 23);
      onLevel(Math.min(1, Math.max(0.18, wave + flutter)));
    }
    raf = window.requestAnimationFrame(tick);
  };

  raf = window.requestAnimationFrame(tick);

  return () => {
    running = false;
    window.cancelAnimationFrame(raf);
  };
}
