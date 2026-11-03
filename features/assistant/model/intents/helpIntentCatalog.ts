/** Aide / capacités. */
export const HELP_PATTERNS: readonly RegExp[] = [
  /^(aide|help|secours|sos|commands?|menu)\b/i,
  /\bque (peux|peut)-tu faire\b/i,
  /\bque (sais|peux)-tu faire\b/i,
  /\bquelles? (sont )?(tes|vos) (commandes|capacit[ée]s|fonctions|intents|possibilit[ée]s)\b/i,
  /\bcomment (ça|ca) marche\b/i,
  /\bcomment (t['’]utiliser|je (te|t['’])\s*parle|je t['’]utilise)\b/i,
  /\b(dis|montre|liste)(?:-moi)? (tes|vos) (commandes|intents|possibilit[ée]s|capacit[ée]s)\b/i,
  /\b(menu|commandes?|capacit[ée]s?|capabilities|skills)\b/i,
  /\bà quoi tu sers\b/i,
  /\bqu['’]est-ce que tu (sais|peux|fais)\b/i,
  /\b(aide[- ]moi|besoin d['’]aide|au secours)\b/i,
  /\bwhat can you (do|help)\b/i,
  /\b(how (?:do|to) (?:i |you )?use)\b/i,
];
