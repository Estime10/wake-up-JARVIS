/**
 * Textes FR — seule source des libellés UI.
 * Ajouter une clé ici avant tout nouveau texte à l'écran.
 */
export const fr = {
  app: {
    name: "JARVIS",
    shortName: "JARVIS",
    description: "Assistant JARVIS",
  },
  user: {
    displayName: "DevinChat",
  },
  intro: {
    /** Total mails reçus au moment de l'ouverture (snapshot). */
    mailTotal: "{count} mails",
    online: "EN LIGNE",
    offline: "HORS LIGNE",
    /** Sigle : capitales dans la source (exception DA). */
    wordmark: "JARVIS",
    wakeDetected: "Réveil détecté : « {phrase} »",
    wakePhrase: "Wake up, JARVIS",
    sysNominal: "SYS NOMINAL",
    /** Décor HUD — monospaces, jamais uppercase CSS (lisibilité l/1). */
    latLon: "LAT 50.85 N — LON 4.35 E",
    initProgress: "INIT · {percent} %",
    clockPlaceholder: "—:— · —.—.—",
  },
  greeting: {
    morning: "Bonjour, {name}",
    evening: "Bonsoir, {name}",
  },
  home: {
    sidePanelLabel: "Panneau latéral",
    sideTabsLabel: "Journal et mails",
    tabJournal: "Journal",
    tabMails: "Mails",
    entriesCount: "{count} entrées",
    filterAll: "Filtre : Tous",
    journalEmpty: "Aucune entrée journal pour le moment.",
    composerLabel: "Message à JARVIS",
    composerPlaceholder: "Écris à JARVIS…",
    composerListening: "Écoute…",
    composerMic: "Micro",
    composerMicStop: "Arrêter l'écoute",
    composerMicActive: "Micro actif · clique à nouveau pour arrêter l'écoute",
    composerVoiceOver:
      "La réponse est toujours écrite ; la voix s'ajoute par-dessus",
    composerSend: "Envoyer",
    composerHints: "Entrée · Maj+Entrée · Ctrl+Maj+Espace",
    conversationLabel: "Conversation",
    you: "Toi",
    replying: "en train de répondre",
    stateListening: "Écoute…",
    stateThinking: "Réfléchit…",
    stateSpeaking: "Parle…",
    stateSpeakingMuted: "Parole coupée",
    listeningHint: "Niveau de voix : moyen · transcription en direct",
    muteVoice: "Couper la voix",
    unmuteVoice: "Réactiver la voix",
    escapeInterrupt: "Échap pour interrompre",
  },
} as const;

export type FrMessages = typeof fr;
