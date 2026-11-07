/**
 * Catalogue d'intents JARVIS v2 — GÉNÉRÉ par proposals/intents-v2/tools/generate.py (ne pas éditer à la main).
 * Même format que features/assistant/model/intents/*Phrases.ts (@03cf47e) : tableaux `as const`,
 * slots {label} {repo} {folder} {file} {n} + NOUVEAUX {account} {text} (à brancher dans SLOT_CAPTURE), max 2 par phrase.
 */

/** ui.phrase_catalog — ouvrir la liste des phrases (existant-ui). */
export const UI_PHRASE_CATALOG_SHORTCUTS = [
  "/phrases",
  "/catalogue",
  "/exemples",
] as const;

export const UI_PHRASE_CATALOG_PHRASES = [
  "ouvre la liste des phrases",
  "montre la liste des phrases",
  "affiche la liste des phrases",
  "liste des phrases",
  "les phrases",
  "mes phrases",
  "toutes les phrases",
  "le catalogue de phrases",
  "ouvre le catalogue",
  "montre le catalogue",
  "quelles phrases je peux dire",
  "qu'est-ce que je peux dire exactement",
  "les phrases que tu comprends",
  "tu comprends quelles phrases",
  "montre les exemples",
  "des exemples",
  "donne moi des exemples",
  "exemples",
] as const;

/** ui.panel_mail — afficher le panneau mails (à-brancher). */
export const UI_PANEL_MAIL_SHORTCUTS = ["/panneau-mails"] as const;

export const UI_PANEL_MAIL_PHRASES = [
  "ouvre le panneau mails",
  "ouvre le panneau mail",
  "affiche le panneau mails",
  "montre le panneau mails",
  "le panneau mails",
  "panneau mail",
  "ouvre la vue mails",
  "affiche la vue mails",
  "passe sur les mails",
  "va sur les mails",
  "onglet mails",
  // Exact — sinon « ouvre {file} » (files.open) capture « mes mails ».
  "ouvre mes mails",
  "ouvre mails",
  "ouvre mail",
  "ouvre mes boites mail",
  "ouvre mes boîtes mail",
  "ouvre ma messagerie",
  "ouvre la messagerie",
] as const;

/** ui.panel_repos — afficher le panneau dépôts (à-brancher). */
export const UI_PANEL_REPOS_SHORTCUTS = ["/repos-panneau"] as const;

export const UI_PANEL_REPOS_PHRASES = [
  "ouvre le panneau dépôts",
  "ouvre le panneau des dépôts",
  "affiche le panneau dépôts",
  "montre le panneau dépôts",
  "le panneau dépôts",
  "panneau repos",
  "ouvre le panneau repos",
  "ouvre le panneau github",
  "affiche le panneau github",
  "passe sur github",
  "va sur github",
  "ouvre le panneau de {repo}",
  "ouvre {repo} dans le panneau",
  "affiche {repo} dans le panneau",
  "montre {repo} dans le panneau",
  "ouvre le repo {repo}",
  "ouvre le dépôt {repo}",
  "ouvre le projet github {repo}",
  "va sur le repo {repo}",
  "ouvre le panneau depots",
  "ouvre le panneau des depots",
  "affiche le panneau depots",
  "montre le panneau depots",
  "le panneau depots",
  "ouvre le depot {repo}",
] as const;

/** ui.repo_tab_pr — onglet PR du panneau Dépôts (à-brancher). */
export const UI_REPO_TAB_PR_PHRASES = [
  "onglet pr",
  "ouvre l'onglet pr",
  "va sur l'onglet pr",
  "passe sur l'onglet pr",
  "onglet pr de {repo}",
  "ouvre l'onglet pr de {repo}",
  "affiche l'onglet pr de {repo}",
  "onglet pull requests",
  "ouvre l'onglet pull requests",
  "va sur l'onglet pull requests",
  "passe sur l'onglet pull requests",
  "onglet pull requests de {repo}",
  "ouvre l'onglet pull requests de {repo}",
  "affiche l'onglet pull requests de {repo}",
  "onglet prs",
  "ouvre l'onglet prs",
  "va sur l'onglet prs",
  "passe sur l'onglet prs",
  "onglet prs de {repo}",
  "ouvre l'onglet prs de {repo}",
  "affiche l'onglet prs de {repo}",
] as const;

/** ui.repo_tab_commits — onglet Commits du panneau Dépôts (à-brancher). */
export const UI_REPO_TAB_COMMITS_PHRASES = [
  "onglet commits",
  "ouvre l'onglet commits",
  "va sur l'onglet commits",
  "passe sur l'onglet commits",
  "onglet commits de {repo}",
  "ouvre l'onglet commits de {repo}",
  "affiche l'onglet commits de {repo}",
] as const;

/** ui.repo_tab_files — onglet Fichiers du panneau Dépôts (à-brancher). */
export const UI_REPO_TAB_FILES_PHRASES = [
  "onglet fichiers",
  "ouvre l'onglet fichiers",
  "va sur l'onglet fichiers",
  "passe sur l'onglet fichiers",
  "onglet fichiers de {repo}",
  "ouvre l'onglet fichiers de {repo}",
  "affiche l'onglet fichiers de {repo}",
  "onglet files",
  "ouvre l'onglet files",
  "va sur l'onglet files",
  "passe sur l'onglet files",
  "onglet files de {repo}",
  "ouvre l'onglet files de {repo}",
  "affiche l'onglet files de {repo}",
] as const;

/** ui.repo_tab_branches — onglet Branches du panneau Dépôts (à-brancher). */
export const UI_REPO_TAB_BRANCHES_PHRASES = [
  "onglet branches",
  "ouvre l'onglet branches",
  "va sur l'onglet branches",
  "passe sur l'onglet branches",
  "onglet branches de {repo}",
  "ouvre l'onglet branches de {repo}",
  "affiche l'onglet branches de {repo}",
] as const;

/** ui.close_panel — fermer le panneau ouvert (à-brancher). */
export const UI_CLOSE_PANEL_SHORTCUTS = [
  "/ferme",
  "/close",
  "/retour",
] as const;

export const UI_CLOSE_PANEL_PHRASES = [
  "ferme le panneau",
  "ferme ça",
  "ferme",
  "ferme la fenêtre",
  "ferme l'aperçu",
  "ferme le tiroir",
  "ferme les panneaux",
  "ferme tout",
  "ferme le terminal",
  "ferme terminal",
  "ferme la console",
  "ferme le shell",
  "ferme les mails",
  "ferme le mail",
  "ferme les e-mails",
  "ferme github",
  "ferme le github",
  "ferme les repos",
  "ferme le panneau dépôts",
  "ferme les dépôts",
  "cache le panneau",
  "cache ça",
  "masque le panneau",
  "retour",
  "reviens",
  "retour à l'accueil",
  "reviens à l'accueil",
  "page d'accueil",
  "accueil",
  "close",
  "ferme ca",
  "ferme la fenetre",
  "ferme l'apercu",
  "cache ca",
  "retour a l'accueil",
  "reviens a l'accueil",
  "ferme le panneau depots",
  "ferme les depots",
] as const;

/** ui.stop_speaking — arrêter de parler (voix) (à-brancher). */
export const UI_STOP_SPEAKING_PHRASES = [
  "tais toi",
  "taisez-vous",
  "chut",
  "chuut",
  "silence",
  "arrête de parler",
  "arrete de parler",
  "arrête de causer",
  "stop la voix",
  "coupe la voix",
  "ferme la voix",
  "moins de blabla",
  "shut up",
  "arrete de causer",
] as const;

/** ui.mute — couper la voix de JARVIS (à-brancher). */
export const UI_MUTE_PHRASES = [
  "coupe le son",
  "mode silencieux",
  "passe en mode texte",
  "réponds en texte",
  "réponds par écrit",
  "plus de voix",
  "désactive la voix",
  "mute",
  "mets toi en muet",
  "reponds en texte",
  "reponds par ecrit",
  "desactive la voix",
] as const;

/** ui.unmute — réactiver la voix (à-brancher). */
export const UI_UNMUTE_PHRASES = [
  "remets le son",
  "réactive la voix",
  "active la voix",
  "parle moi",
  "parle",
  "mode vocal",
  "réponds à voix haute",
  "lis à voix haute",
  "unmute",
  "reactive la voix",
  "reponds a voix haute",
  "lis a voix haute",
] as const;
