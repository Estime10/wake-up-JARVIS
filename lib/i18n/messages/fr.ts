/**
 * Textes FR — seule source des libellés UI.
 * Ajouter une clé ici avant tout nouveau texte à l'écran.
 */
export const fr = {
  app: {
    name: "JARVIS",
    shortName: "JARVIS",
    description: "Assistant JARVIS",
    systemReady: "Système prêt",
  },
  user: {
    displayName: "DevinChat",
  },
  intro: {
    /** Casse normale : les capitales viennent de `.t-label` / CSS. */
    skip: "Passer",
    /** Sigle : capitales dans la source (exception DA). */
    wordmark: "JARVIS",
  },
  greeting: {
    morning: "Bonjour, {name}",
    evening: "Bonsoir, {name}",
  },
} as const;

export type FrMessages = typeof fr;
