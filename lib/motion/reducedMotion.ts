import gsap from "gsap";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const MOTION_CONDITIONS = {
  reduce: REDUCED_MOTION_QUERY,
  motion: "(prefers-reduced-motion: no-preference)",
} as const;

/** Lecture synchrone au moment d'agir (client : handlers, callbacks). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia(REDUCED_MOTION_QUERY).matches
  );
}

/**
 * Lance `run` avec la préférence réelle et le rejoue (revert puis run) si
 * elle change. Aucun état React → pas de premier rendu à la valeur serveur,
 * donc pas de flash de mouvement.
 *
 * À appeler dans un callback `useGSAP` en lui passant son contexte (`owner`)
 * et en RETOURNANT le cleanup obtenu. Le matchMedia est créé hors
 * enregistrement (`owner.ignore`) : sinon GSAP range son contexte interne à
 * la fois dans `owner` et dans le matchMedia, et chaque tween est revert deux
 * fois (le 2e revert ré-applique l'état de départ, ex. opacity 0 figée).
 */
export function matchReducedMotion(
  owner: gsap.Context,
  run: (
    reducedMotion: boolean,
    context: gsap.Context,
  ) => (() => void) | undefined,
): () => void {
  let revert = (): void => {};
  owner.ignore(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_CONDITIONS, (context) =>
      run(context.conditions?.reduce === true, context),
    );
    revert = () => mm.revert();
  });
  return revert;
}
