export type MainFocusRequest = {
  /** Fin d'intro (complète ou passée) — avant `router.replace`. */
  request: () => void;
  /** Lit et efface la demande (une seule prise de focus). */
  consume: () => boolean;
};

/**
 * Demande de focus sur le contenu principal après l'intro.
 * Une instance par coquille (JarvisShell) — aucun état module.
 */
export function createMainFocusRequest(): MainFocusRequest {
  let pending = false;

  return {
    request() {
      pending = true;
    },
    consume() {
      const wasPending = pending;
      pending = false;
      return wasPending;
    },
  };
}
