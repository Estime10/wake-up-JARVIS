/**
 * Niveau voix simulé (~30 Hz) — sinus + bruit.
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
      const noise = Math.random() * 0.18;
      onLevel(Math.min(1, Math.max(0.18, wave + noise)));
    }
    raf = window.requestAnimationFrame(tick);
  };

  raf = window.requestAnimationFrame(tick);

  return () => {
    running = false;
    window.cancelAnimationFrame(raf);
  };
}
