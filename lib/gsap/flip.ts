import gsap from "gsap";
import { Flip } from "gsap/Flip";

// Plugin enregistré à l'import (modules client). Sous SSR, `Flip.register`
// ne fait rien (pas de `document`) : aucun appel Flip n'y est fait.
gsap.registerPlugin(Flip);

export { Flip };

/** État capturé par `Flip.getState` (bounds + matrice, par `data-flip-id`). */
export type FlipState = ReturnType<typeof Flip.getState>;
