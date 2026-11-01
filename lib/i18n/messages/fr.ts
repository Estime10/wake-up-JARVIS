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
    /** Host du prompt shell (identité machine — hors web API). */
    terminalHost: "42:D6:C0:B0:3E:8D",
  },
  intro: {
    /** Total mails reçus au moment de l'ouverture (snapshot). */
    mailTotal: "{count} mails",
    /** Sigle : capitales dans la source (exception DA). */
    wordmark: "JARVIS",
    wakeDetected: "Réveil détecté : « {phrase} »",
    wakePhrase: "Wake up, JARVIS",
    sysNominal: "sys nominal",
    /** HUD mono — coords GPS (jamais uppercase CSS : l/1). */
    latLon: "LAT {lat} {ns} — LON {lon} {ew}",
    latLonPending: "LAT — · — LON —",
    latLonUnavailable: "LAT — · — LON —",
    /** Lieu issu du reverse geocode. */
    location: "LOC · {place}",
    locationPending: "LOC · …",
    locationUnavailable: "LOC · —",
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
    /** CTA HUD — agent terminal (branchement réel plus tard). */
    terminal: "Terminal",
    terminalClose: "Close Terminal",
    terminalLabel: "Ouvrir le terminal",
    terminalCloseLabel: "Fermer le terminal",
    terminalShellLabel: "Terminal",
    terminalInputLabel: "Commande",
    /** Message zsh natif (macOS), toujours en anglais. */
    terminalCommandNotFound: "zsh: command not found: {command}",
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
