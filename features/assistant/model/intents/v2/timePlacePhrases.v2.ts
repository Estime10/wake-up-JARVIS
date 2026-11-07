/**
 * Catalogue d'intents JARVIS v2 — GÉNÉRÉ par proposals/intents-v2/tools/generate.py (ne pas éditer à la main).
 * Même format que features/assistant/model/intents/*Phrases.ts (@03cf47e) : tableaux `as const`,
 * slots {label} {repo} {folder} {file} {n} + NOUVEAUX {account} {text} (à brancher dans SLOT_CAPTURE), max 2 par phrase.
 */

/** time.now — l'heure (à-décider). */
export const TIME_NOW_SHORTCUTS = ["/heure", "/time"] as const;

export const TIME_NOW_PHRASES = [
  "quelle heure est-il",
  "quelle heure il est",
  "il est quelle heure",
  "il est quel heure",
  "il est quelle heure là",
  "l'heure",
  "l'heure stp",
  "donne moi l'heure",
  "dis moi l'heure",
  "t'as l'heure",
  "tu as l'heure",
  "vous avez l'heure",
  "auriez-vous l'heure",
  "pourriez-vous me donner l'heure",
  "c'est quelle heure",
  "heure",
  "quelle heure",
  "kel heure",
  "kelle heure il est",
  "what time is it",
  "time",
  "il est quelle heure la",
] as const;

/** time.date — la date du jour (à-décider). */
export const TIME_DATE_SHORTCUTS = ["/date", "/jour"] as const;

export const TIME_DATE_PHRASES = [
  "on est quel jour",
  "on est le combien",
  "on est le combien aujourd'hui",
  "quel jour on est",
  "quel jour sommes-nous",
  "quel jour est-on",
  "quelle est la date",
  "quelle date",
  "quelle date aujourd'hui",
  "la date",
  "la date d'aujourd'hui",
  "la date du jour",
  "donne moi la date",
  "c'est quoi la date",
  "c'est quel jour aujourd'hui",
  "aujourd'hui c'est quel jour",
  "on est quel mois",
  "on est en quelle année",
  "quelle semaine on est",
  "on est quelle semaine",
  "c'est quelle semaine",
  "pourriez-vous me donner la date",
  "what day is it",
  "what's the date",
  "date",
  "on est en quelle annee",
] as const;

/** geo.where — où suis-je (position navigateur) (à-décider). */
export const GEO_WHERE_SHORTCUTS = ["/position", "/ou"] as const;

export const GEO_WHERE_PHRASES = [
  "où suis-je",
  "ou suis je",
  "où je suis",
  "je suis où",
  "on est où",
  "où est-ce que je suis",
  "tu sais où je suis",
  "ma position",
  "ma localisation",
  "ma géolocalisation",
  "ma geoloc",
  "localise moi",
  "géolocalise moi",
  "dans quelle ville je suis",
  "je suis dans quelle ville",
  "on est dans quelle ville",
  "c'est quoi ma ville",
  "où sommes-nous",
  "pourriez-vous me localiser",
  "where am i",
  "my location",
  "ou je suis",
  "je suis ou",
  "on est ou",
  "ou est-ce que je suis",
  "tu sais ou je suis",
  "ma geolocalisation",
  "geolocalise moi",
  "ou sommes-nous",
] as const;
