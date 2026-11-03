/** Mot « label » et variantes / typos FR. */
export const MAIL_LABEL_WORD =
  "(?:labels?|labells?|lables?|labals?|libell[ée]s?|libelles?|cat[ée]gories?|categos?|dossiers?|tags?|folders?|bo[iî]tes?)";

const MAIL_NOUN = "(?:mails?|e-?mails?|courriers?|messages?|msg)";
const SHOW =
  "(?:donne(?:-moi)?|montre(?:-moi)?|affiche(?:-moi)?|liste(?:-moi)?|sort(?:-moi)?|cherche(?:-moi)?|trouve(?:-moi)?|rappelle(?:-moi)?|passe(?:-moi)?|sors(?:-moi)?|balaye|scanne|check|voir|lis|lire|ouvre|ouvrir|r[ée]cup[èe]re(?:-moi)?)";

/**
 * Catalogue phrases → mails par label (reçus).
 * Capture groupe 1 = label.
 */
export const MAIL_LIST_BY_LABEL_PATTERNS: readonly RegExp[] = [
  // donne/montre/… mails … label X
  new RegExp(
    `${SHOW}\\s+(?:moi\\s+)?(?:les\\s+|mes\\s+|tous\\s+(?:les\\s+)?|tout\\s+(?:le\\s+)?)?${MAIL_NOUN}.{0,80}?${MAIL_LABEL_WORD}\\s+(?:["«']|nomm[ée]e?\\s+|appel[ée]e?\\s+)?([^"'»\\n,.!?]+)`,
    "i",
  ),
  // mails … label / catégorie / tag X
  new RegExp(
    `${MAIL_NOUN}.{0,72}?${MAIL_LABEL_WORD}\\s+(?:["«']|nomm[ée]e?\\s+)?([^"'»\\n,.!?]+)`,
    "i",
  ),
  // avec le label X / portant le label X
  new RegExp(
    `(?:avec|portant|ayant|sous|filtr[ée]s?\\s+(?:par|avec))\\s+(?:le\\s+|la\\s+|les\\s+)?${MAIL_LABEL_WORD}\\s+["«']?([^"'»\\n,.!?]+)`,
    "i",
  ),
  // label X (seul ou en tête)
  new RegExp(
    `(?:^|\\b)(?:du\\s+|des\\s+|de\\s+|le\\s+|la\\s+)?${MAIL_LABEL_WORD}\\s+["«']?([^"'»\\n,.!?]+)`,
    "i",
  ),
  // mails du/des label X
  new RegExp(
    `${MAIL_NOUN}\\s+(?:du\\s+|des\\s+|de\\s+)?${MAIL_LABEL_WORD}\\s+["«']?([^"'»\\n,.!?]+)`,
    "i",
  ),
  // montre mes mails DEV / liste les emails FACTURES (label en fin)
  new RegExp(
    `${SHOW}\\s+(?:moi\\s+)?(?:les\\s+|mes\\s+|tous\\s+(?:les\\s+)?)?${MAIL_NOUN}.{0,56}?["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})["»']?\\s*[.!?]*$`,
    "i",
  ),
  // qu'est-ce que j'ai / c'est quoi / y a quoi en/dans/sur DEV
  /(?:qu['’]est-ce que j['’]ai|c['’]est quoi|quoi (?:comme|comme des)?|y a quoi|ya quoi|il y a quoi|t['’]as quoi|tu as quoi)\s+(?:comme\s+)?(?:mails?\s+)?(?:en|dans|sur|pour)\s+["«']?([^"'»\n,.!?]+)/i,
  // regarde / check / scanne DEV
  /(?:regarde|check|scanne|balaye|filtre)\s+(?:les\s+)?(?:mails?\s+)?(?:en|dans|sur|de|du)?\s*["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})/i,
  // mails en/dans/sur/de/pour DEV
  new RegExp(
    `${MAIL_NOUN}\\s+(?:en|dans|sur|de|du|des|pour|c[ôo]t[ée])\\s+["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})["»']?\\s*[.!?]*$`,
    "i",
  ),
  // mails DEV (fin)
  new RegExp(
    `${MAIL_NOUN}\\s+["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})["»']?\\s*[.!?]*$`,
    "i",
  ),
  // DEV label / DEV mails
  new RegExp(
    `["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})["»']?\\s+(?:${MAIL_LABEL_WORD}|${MAIL_NOUN})`,
    "i",
  ),
  // contenu / boîte / inbox DEV
  /(?:contenu|contenu de|bo[iî]te|inbox|folder)\s+(?:mails?\s+)?["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})/i,
  // filtre / filtre sur DEV
  /(?:filtre|filtrer|filtrés?)(?:\s+les\s+mails?)?\s+(?:sur|par|avec)?\s*["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})/i,
  // résume / résumé des mails DEV
  new RegExp(
    `(?:r[ée]sume|r[ée]sum[ée]|brief|briefing)\\s+(?:moi\\s+)?(?:les\\s+|mes\\s+)?${MAIL_NOUN}.{0,40}?(?:${MAIL_LABEL_WORD}\\s+|en\\s+|dans\\s+|sur\\s+)?["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})`,
    "i",
  ),
  // parlons de / au sujet de DEV (mails)
  /(?:parlons|parle(?:-moi)?)\s+(?:des?\s+)?(?:mails?\s+)?(?:de|du|des|sur)\s+["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})/i,
  // emails tagged / labeled X
  /(?:emails?|mails?).{0,24}?(?:tagged|labeled|labelled)\s+["']?([A-Za-z0-9&/ _-]{1,64})/i,
  // show me mails in X
  /(?:show|list|get)\s+(?:me\s+)?(?:the\s+)?(?:mails?|emails?).{0,24}?(?:label|in|with)\s+["']?([A-Za-z0-9&/ _-]{1,64})/i,
];

/**
 * Envois / réponses envoyées pour un label.
 * Capture groupe 1 = label.
 */
export const MAIL_LIST_SENT_BY_LABEL_PATTERNS: readonly RegExp[] = [
  /(?:ce que j['’]ai|mes)\s+(?:r[ée]ponses?|envois?|envoy[ée]s?|mails?\s+envoy[ée]s?).{0,48}?(?:label|libell[ée]|cat[ée]gorie|en|dans|sur|pour)\s+["«']?([^"'»\n,.!?]+)/i,
  /(?:mails?|r[ée]ponses?|messages?)\s+(?:que j['’]ai\s+)?(?:envoy[ée]s?|r[ée]pondu|écrits?).{0,48}?(?:label|libell[ée]|cat[ée]gorie|en|dans|sur|pour)\s+["«']?([^"'»\n,.!?]+)/i,
  /(?:envoy[ée]s?|sent|outbox|bo[iî]te\s+d['’]envoi).{0,32}?(?:label|libell[ée]|cat[ée]gorie)\s+["«']?([^"'»\n,.!?]+)/i,
  /(?:mes\s+)?(?:r[ée]ponses?|envois?)\s+(?:en|dans|sur|pour)\s+["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})/i,
  /(?:qu['’]est-ce que j['’]ai\s+)?(?:r[ée]pondu|envoy[ée])\s+(?:en|dans|sur)\s+["«']?([A-Za-z0-9ÉÈÊËÀÂÄÙÛÜÔÖÇéèêëàâäùûüôöç&/ _-]{1,64})/i,
  /(?:show|list)\s+(?:my\s+)?(?:sent|replies?).{0,24}?(?:label|in)\s+["']?([A-Za-z0-9&/ _-]{1,64})/i,
];

/** Mails signalés / inhabituels. */
export const MAIL_LIST_FLAGGED_PATTERNS: readonly RegExp[] = [
  /(?:mails?|e-?mails?|courriers?|messages?).{0,32}?(?:signal[ée]s?|flagg?[ée]s?|inhabituels?|suspects?|alertes?|urgents?|prioritaires?|[ée]pingl[ée]s?|starred|star)/i,
  /(?:montre|liste|affiche|donne|voir|check|scanne).{0,32}?(?:signal[ée]s?|flagg?[ée]s?|inhabituels?|suspects?|alertes?|urgents?|[ée]pingl[ée]s?)/i,
  /(?:qu['’]est-ce qui est|quoi (?:est )?)(?:signal[ée]|flagg?[ée]|inhabituel|suspect|urgent|prioritaire)/i,
  /(?:y a(?:-t-il)?|il y a)\s+(?:des?\s+)?(?:mails?\s+)?(?:signal[ée]s?|inhabituels?|suspects?|urgents?)/i,
  /\b(?:flagged|unusual|starred|priority)\s+(?:mails?|emails?)?\b/i,
  /\b(?:mails?|emails?)\s+(?:flagged|unusual|starred)\b/i,
];

/** Liste récente / derniers mails. */
export const MAIL_LIST_RECENT_PATTERNS: readonly RegExp[] = [
  /(?:derniers?|r[ée]cents?|nouveaux|fra[iî]ches?)\s+(?:mails?|e-?mails?|courriers?|messages?)/i,
  /(?:mails?|e-?mails?|courriers?|messages?)\s+(?:r[ée]cents?|du jour|d['’]aujourd['’]hui|aujourd['’]hui|nouveaux|fra[iî]s|arriv[ée]s?)/i,
  /(?:montre|liste|affiche|donne|voir|check).{0,24}?(?:derniers?|r[ée]cents?|nouveaux)\s+(?:mails?|e-?mails?|messages?)/i,
  /^(?:inbox|bo[iî]te\s+de\s+r[ée]ception|r[ée]ception)\s*[.!?]*$/i,
  /(?:quoi\s+de\s+neuf|nouveaut[ée]s?)\s+(?:dans\s+)?(?:mes\s+)?(?:mails?|e-?mails?|la\s+bo[iî]te)?/i,
  /(?:mails?|e-?mails?)\s+(?:de\s+)?(?:ce\s+matin|cette\s+nuit|cette\s+semaine)?\s*$/i,
  /\b(?:recent|latest|new)\s+(?:mails?|emails?)\b/i,
  /\b(?:show|list)\s+(?:my\s+)?(?:inbox|recent\s+mails?)\b/i,
];

/** Compte / combien de mails. */
export const MAIL_COUNT_PATTERNS: readonly RegExp[] = [
  /(?:combien|nombre)\s+(?:de\s+)?(?:mails?|e-?mails?|courriers?|messages?)/i,
  /(?:mails?|e-?mails?|courriers?|messages?).{0,24}?(?:au total|en tout|compt[ée]s?|restants?)/i,
  /(?:j['’]ai combien|y a combien|t['’]as combien|tu as combien)\s+(?:de\s+)?(?:mails?|e-?mails?)/i,
  /(?:compte|compter|d[ée]nombre)\s+(?:mes\s+|les\s+)?(?:mails?|e-?mails?)/i,
  /\b(?:how many|count)\s+(?:mails?|emails?)\b/i,
];

export const MAIL_GENERIC_REJECT =
  /^(mes|tous|toutes|aujourd.?hui|mails?|e-?mails?|courriers?|messages?|msg|reçus?|non\s*lus?|nouveaux|r[ée]cents?|derniers?|signal[ée]s?|flagg?[ée]s?|inhabituels?|urgents?|envoy[ée]s?|inbox|github|repos?)$/i;
