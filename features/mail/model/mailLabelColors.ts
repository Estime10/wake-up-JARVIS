/**
 * Couleurs dossiers Gmail — **toutes** les boîtes.
 * Match sur le dossier racine (libellé POSTMAN / Gmail).
 * Map versionnée dans le code : une table DB seulement si édition runtime un jour.
 */

/** Hex par dossier racine (clés normalisées sans accents). */
const TOP_FOLDER_COLORS: Record<string, string> = {
  // Perso
  ALERTES: "#e11d48",
  FACTURES: "#ca8a04",
  "BANQUE & CREDIT": "#14b8a6",
  "ADMINISTRATIF & JURIDIQUE": "#1d4ed8",
  LOGEMENT: "#16a34a",
  SPORT: "#16a34a",
  NEWSLETTERS: "#4ade80",
  "COMMANDES & LIVRAISONS": "#ea580c",
  "TECH & DEV": "#7c3aed",
  LOISIRS: "#5b21b6",
  EMPLOI: "#92400e",
  SANTE: "#db2777",
  PERSO: "#2563eb",
  ECOLE: "#2563eb",
  FAMILLE: "#2563eb",
  VEHICULE: "#57534e",
  SONDAGES: "#78716c",
  "RESEAUX SOCIAUX": "#a8a29e",
  DIVERS: "#a8a29e",
  // Pro / estime
  LINKEDIN: "#92400e",
  "EMPLOI & RECRUTEMENT": "#92400e",
  DEV: "#7c3aed",
  "RH & TRAVAIL": "#1d4ed8",
  DOCUMENTS: "#1d4ed8",
  "SECURITE & COMPTES": "#e11d48",
  "PROJETS & CLIENTS": "#7c3aed",
  FORMATION: "#92400e",
  NOTES: "#a8a29e",
};

const ALERT_COLOR = "#e11d48";

const SYSTEM_LABELS = new Set([
  "INBOX",
  "SENT",
  "UNREAD",
  "STARRED",
  "IMPORTANT",
  "DRAFT",
  "TRASH",
  "SPAM",
  "CHAT",
  "CATEGORY_PERSONAL",
  "CATEGORY_SOCIAL",
  "CATEGORY_PROMOTIONS",
  "CATEGORY_UPDATES",
  "CATEGORY_FORUMS",
]);

/** Clé comparable (sans accents, majuscules) — match label / catégorie. */
export function normalizeMailLabelKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}&/ ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/** Segment racine d’un libellé `PARENT/ENFANT`. */
export function mailLabelTopFolder(label: string): string {
  const first = label.split("/")[0]?.trim() ?? label;
  return first
    .replace(
      /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F⚠️🔴🟡🔵🔷🟢🟩🟠🟣🟪🟤🩷⚫⚪\s]+/u,
      "",
    )
    .trim();
}

export function isGmailSystemLabelId(id: string): boolean {
  return SYSTEM_LABELS.has(id) || id.startsWith("CATEGORY_");
}

export function isGmailSystemLabelName(name: string): boolean {
  const upper = name.trim().toUpperCase();
  return SYSTEM_LABELS.has(upper) || upper.startsWith("CATEGORY_");
}

/** Libellé user le plus spécifique (chemin le plus profond). */
export function pickPrimaryUserLabel(
  labelNames: readonly string[],
): string | null {
  const users = labelNames.filter((name) => !isGmailSystemLabelName(name));
  if (users.length === 0) {
    return null;
  }
  return users.slice().sort((a, b) => {
    const depth = b.split("/").length - a.split("/").length;
    if (depth !== 0) {
      return depth;
    }
    return b.length - a.length;
  })[0]!;
}

function colorForTopFolder(top: string): string | null {
  const key = normalizeMailLabelKey(top);
  const direct = TOP_FOLDER_COLORS[key];
  if (direct) {
    return direct;
  }
  for (const [folder, color] of Object.entries(TOP_FOLDER_COLORS)) {
    if (normalizeMailLabelKey(folder) === key) {
      return color;
    }
  }

  // Heuristiques pro / perso (préfixes)
  if (key.startsWith("SECURITE") || key.startsWith("ALERT")) {
    return ALERT_COLOR;
  }
  if (key.startsWith("LINKEDIN") || key.startsWith("EMPLOI")) {
    return "#92400e";
  }
  if (key === "DEV" || (key.includes("TECH") && key.includes("DEV"))) {
    return "#7c3aed";
  }
  if (key.startsWith("RH") || key.startsWith("DOCUMENT")) {
    return "#1d4ed8";
  }
  if (key.startsWith("FACTURE")) {
    return "#ca8a04";
  }
  if (key.startsWith("RESEAU") || key.startsWith("DIVERS") || key === "NOTES") {
    return "#a8a29e";
  }
  if (
    key.startsWith("PERSO") ||
    key.startsWith("FAMILLE") ||
    key.startsWith("ECOLE")
  ) {
    return "#2563eb";
  }

  return null;
}

/** Couleur hex du libellé — toutes boîtes (même map). */
export function resolveMailLabelColor(
  category: string | undefined,
): string | null {
  if (!category?.trim()) {
    return null;
  }

  const top = mailLabelTopFolder(category);
  const fromFolder = colorForTopFolder(top);
  if (fromFolder) {
    return fromFolder;
  }

  if (
    /phishing|impaye|avocat|recouvrement|paiement|securit|alerte|echeance|action demand/i.test(
      category,
    )
  ) {
    return ALERT_COLOR;
  }

  return null;
}
