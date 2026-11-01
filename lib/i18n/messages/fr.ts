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
    /** Casse via CSS (`uppercase`) — source en minuscules. */
    online: "en ligne",
    offline: "hors ligne",
    /** Sigle : capitales dans la source (exception DA). */
    wordmark: "JARVIS",
    wakeDetected: "Réveil détecté : « {phrase} »",
    wakePhrase: "Wake up, JARVIS",
    sysNominal: "sys nominal",
    /** Décor HUD — monospaces, jamais uppercase CSS (lisibilité l/1). */
    latLon: "LAT 50.85 N — LON 4.35 E",
    initProgress: "INIT · {percent} %",
    clockPlaceholder: "—:— · —.—.—",
    /** Bouton visible ; le nom accessible contient le texte visible (label-in-name). */
    skip: "Passer",
    skipLabel: "Passer l'intro",
  },
  greeting: {
    morning: "Bonjour, {name}",
    evening: "Bonsoir, {name}",
  },
  home: {
    /** Titre de page sr-only (h1 unique) — nom accessible de `main`. */
    title: "JARVIS, accueil",
    sidePanelLabel: "Panneau latéral",
    sideTabsLabel: "Journal et mails",
    tabJournal: "Journal",
    tabMails: "Mails",
    entriesCount: "{count} entrées",
    journalEmpty: "Aucune entrée journal pour le moment.",
    composerLabel: "Message à JARVIS",
    composerPlaceholder: "Écris à JARVIS…",
    composerListening: "Écoute…",
    composerMic: "Micro",
    composerMicStop: "Arrêter l'écoute",
    /** Annonce unique de l'écoute (header, role="status"). */
    micActive: "Micro actif",
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
    listeningHint: "Niveau de voix : moyen · transcription en direct",
    /** Annonceur polite unique (StatusAnnouncer) — hors « Micro actif ». */
    announceThinking: "Réfléchit…",
    announceSpeaking: "Répond…",
    announceError: "Erreur",
    announceOffline: "Hors ligne",
  },
} as const;

export type FrMessages = typeof fr;
