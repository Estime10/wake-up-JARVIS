const GH = "(?:github|git\\s*hub|gh|git)";
const REPO_NOUN =
  "(?:repos?|d[ée]p[ôo]ts?|repositories|repository|projets?(?:\\s+git(?:hub)?)?)";
const PR_NOUN =
  "(?:pr|prs|pull\\s*requests?|pull-?requests?|merges?\\s*requests?|demandes?\\s+de\\s+(?:fusion|merge|tirage)|merge\\s*requests?)";
const COMMIT_NOUN =
  "(?:commits?|commit\\s*logs?|historique(?:\\s+git)?|logs?(?:\\s+git)?)";
const BRANCH_NOUN = "(?:branches?|branchs?|br)";
const SHOW =
  "(?:liste|montre|affiche|donne|voir|lis|cherche|trouve|check|scanne|ouvre|ouvrir|r[ée]cup[èe]re)(?:-moi)?";

/** Nom repo capturable : `owner/repo` ou `repo`. */
export const REPO_TOKEN = "([A-Za-z0-9_.-]+(?:\\/[A-Za-z0-9_.-]+)?)";

/** Statut / connexion GitHub. */
export const GITHUB_STATUS_PATTERNS: readonly RegExp[] = [
  new RegExp(
    `(?:statut|status|[ée]tat|connexion|connect[ée]?|reli[ée]?|link(?:ed)?|auth|authentifi[ée]?|session)\\s+(?:de\\s+|du\\s+|à\\s+|a\\s+|sur\\s+)?${GH}`,
    "i",
  ),
  new RegExp(
    `${GH}\\s+(?:statut|status|connexion|[ée]tat|connect[ée]?|reli[ée]?|ok|auth)`,
    "i",
  ),
  new RegExp(
    `(?:suis[- ]je|es[- ]tu|on est|je suis|t['’]es|tu es)\\s+connect[ée]?\\s+(?:à\\s+|sur\\s+|avec\\s+)?${GH}`,
    "i",
  ),
  new RegExp(`(?:compte|login|utilisateur|user|profil)\\s+${GH}`, "i"),
  new RegExp(`${GH}\\s+(?:compte|login|user|profil)`, "i"),
  /\b(?:github\s+ok|gh\s+status|am i (?:logged|connected) (?:to |on )?github)\b/i,
  /(?:mon\s+)?(?:pat|token)\s+(?:github|gh)\b/i,
  /(?:github|gh)\s+(?:pat|token|connexion)\b/i,
];

/** Liste des repos. */
export const GITHUB_LIST_REPOS_PATTERNS: readonly RegExp[] = [
  new RegExp(
    `${SHOW}\\s+(?:moi\\s+)?(?:mes\\s+|tous\\s+(?:mes\\s+)?|tout\\s+(?:mes\\s+)?)?${REPO_NOUN}(?:\\s+${GH})?`,
    "i",
  ),
  new RegExp(
    `(?:mes|tous\\s+mes|tout\\s+mes)\\s+${REPO_NOUN}(?:\\s+${GH})?`,
    "i",
  ),
  new RegExp(`${GH}\\s+(?:repos?|d[ée]p[ôo]ts?|projets?|repositories)`, "i"),
  new RegExp(
    `(?:quels?|quelles?)\\s+(?:sont\\s+)?(?:mes\\s+)?${REPO_NOUN}`,
    "i",
  ),
  new RegExp(
    `(?:j['’]ai quels?|combien de|t['’]as quels?|tu as quels?)\\s+${REPO_NOUN}`,
    "i",
  ),
  new RegExp(
    `(?:r[ée]sume|r[ée]sum[ée]|brief)\\s+(?:moi\\s+)?(?:mes\\s+)?${REPO_NOUN}`,
    "i",
  ),
  new RegExp(
    `(?:parle(?:-moi)?|parlons)\\s+(?:de\\s+)?(?:mes\\s+)?${REPO_NOUN}`,
    "i",
  ),
  /\b(?:list\s+repos?|my\s+repos?|show\s+(?:me\s+)?(?:my\s+)?repos?)\b/i,
  /\b(?:repositories|github\s+projects?)\b/i,
];

/**
 * PRs d’un repo — groupe 1 = repoQuery.
 */
export const GITHUB_LIST_PULLS_PATTERNS: readonly RegExp[] = [
  new RegExp(
    `${PR_NOUN}\\s+(?:ouvertes?\\s+|ouvertes?\s+)?(?:sur|de|du|dans|pour|du\s+repo)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  new RegExp(
    `${SHOW}\\s+(?:les\\s+|mes\\s+|toutes\\s+(?:les\\s+)?)?${PR_NOUN}.{0,48}?(?:sur|de|du|dans|pour)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  new RegExp(
    `(?:ouvertes?\\s+)?${PR_NOUN}\\s+(?:du\\s+)?(?:repo|d[ée]p[ôo]t|projet)?\\s*["«']?${REPO_TOKEN}`,
    "i",
  ),
  new RegExp(`["«']?${REPO_TOKEN}["»']?\\s+(?:${PR_NOUN}|pulls?)`, "i"),
  new RegExp(
    `(?:y a(?:-t-il)?|il y a|combien)\\s+(?:de\\s+)?${PR_NOUN}.{0,32}?(?:sur|de|du|dans|pour)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  new RegExp(
    `(?:check|v[ée]rifie|regarde)\\s+(?:les\\s+)?${PR_NOUN}.{0,32}?(?:sur|de|du)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  /\bpulls?\s+(?:on|for|of|in)\s+["']?([A-Za-z0-9_./-]+)["']?/i,
  /\b(?:open\s+)?(?:prs?|pull\s*requests?)\s+(?:on|for|of)\s+["']?([A-Za-z0-9_./-]+)["']?/i,
];

/**
 * Commits d’un repo — groupe 1 = repoQuery.
 */
export const GITHUB_LIST_COMMITS_PATTERNS: readonly RegExp[] = [
  new RegExp(
    `(?:derniers?\\s+|r[ée]cents?\\s+)?${COMMIT_NOUN}\\s+(?:sur|de|du|dans|pour)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  new RegExp(
    `${SHOW}\\s+(?:les\\s+|mes\\s+|les\\s+derniers?\\s+)?${COMMIT_NOUN}.{0,48}?(?:sur|de|du|dans|pour)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  new RegExp(`["«']?${REPO_TOKEN}["»']?\\s+${COMMIT_NOUN}`, "i"),
  new RegExp(
    `(?:historique|log|activity|activit[ée])\\s+(?:git\\s+)?(?:de|du|sur)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  new RegExp(
    `(?:quoi\s+de\s+neuf|derni[èe]res?\s+(?:modifs?|modifications?))\\s+(?:sur|dans|de)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  /\b(?:commits?|git\s+log)\s+(?:on|for|of)\s+["']?([A-Za-z0-9_./-]+)["']?/i,
];

/**
 * Branches d’un repo — groupe 1 = repoQuery.
 */
export const GITHUB_LIST_BRANCHES_PATTERNS: readonly RegExp[] = [
  new RegExp(
    `${BRANCH_NOUN}\\s+(?:sur|de|du|dans|pour)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  new RegExp(
    `${SHOW}\\s+(?:les\\s+|mes\\s+|toutes\\s+(?:les\\s+)?)?${BRANCH_NOUN}.{0,48}?(?:sur|de|du|dans|pour)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  new RegExp(`["«']?${REPO_TOKEN}["»']?\\s+${BRANCH_NOUN}`, "i"),
  new RegExp(
    `(?:quelles?|quels?)\\s+(?:sont\\s+)?(?:les\\s+)?${BRANCH_NOUN}.{0,24}?(?:sur|de|du)\\s+["«']?${REPO_TOKEN}`,
    "i",
  ),
  /\bbranches?\s+(?:on|for|of)\s+["']?([A-Za-z0-9_./-]+)["']?/i,
];
