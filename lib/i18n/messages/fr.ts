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
    /** Total mails reçus au moment de l'ouverture (snapshot). */
    mailTotal: "{count} mails",
    /** Température locale à l'ouverture (snapshot mock). */
    temperature: "{celsius} °C",
    /** Sigle : capitales dans la source (exception DA). */
    wordmark: "JARVIS",
    wakeDetected: "Réveil détecté : « {phrase} »",
    wakePhrase: "Wake up, JARVIS",
    sysNominal: "SYS NOMINAL",
    /** Décor HUD — monospaces, jamais uppercase CSS (lisibilité l/1). */
    latLon: "LAT 50.85 N — LON 4.35 E",
    initProgress: "INIT · {percent} %",
  },
  greeting: {
    morning: "Bonjour, {name}",
    evening: "Bonsoir, {name}",
  },
  home: {
    sidePanelLabel: "Panneau latéral",
    tabJournal: "Journal",
    sideEmpty: "Le journal et les mails arriveront ici.",
  },
} as const;

export type FrMessages = typeof fr;
