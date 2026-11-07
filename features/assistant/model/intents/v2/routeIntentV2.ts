/**
 * Routeur de RÉFÉRENCE v2 (proposition, non branché) — zéro IA, zéro réseau.
 * Corrige les défauts du routeur @03cf47e mesurés dans evidence/ :
 *  1. phrases exactes (sans slot) d'abord, toutes intents confondues ;
 *  2. gardes de refus (verbes d'écriture/exécution, secrets, Notes, corbeille…) AVANT les phrases à slots ;
 *  3. phrases à slots triées de la plus spécifique (texte fixe le plus long) à la plus générique ;
 *  4. gardes appliquées aussi aux VALEURS capturées (secrets, Notes, exécution…) + garde « plusieurs actions » ;
 *  5. slots account/repo validés contre les valeurs connues si l'app les fournit ;
 *  6. dernier recours : on retire l'habillage (« je veux voir », « côté mails ») et on réessaie.
 * Normalisation v2 = celle de l'app + accents repliés, ponctuation interne, politesse en tête/fin, nombres en lettres.
 */
import { INTENTS_V2, MAX_PHRASE_SLOTS_V2, type IntentV2 } from "./index.v2";
import {
  COMPOUND_GUARD_V2,
  REFUSE_GUARDS_V2,
  SLOT_NOTES_V2,
} from "./refusePhrases.v2";

const LEADING =
  /^(?:(?:hey|ok|dis|eh|alors|bon|euh|allez|bonjour|salut|coucou|hello) jarvis |jarvis |euh |alors |bon |eh |bonjour |salut |coucou |hello )+/u;
const TRAILING =
  /(?: stp| svp| s'il te plait| s'il vous plait| please| jarvis)+$/u;
const NUMBER_WORDS: Readonly<Record<string, string>> = {
  deux: "2",
  trois: "3",
  quatre: "4",
  cinq: "5",
  six: "6",
  sept: "7",
  huit: "8",
  dix: "10",
  onze: "11",
  douze: "12",
  treize: "13",
  quatorze: "14",
  quinze: "15",
  seize: "16",
  vingt: "20",
  trente: "30",
  quarante: "40",
  cinquante: "50",
};

/** Fautes / écrit SMS fréquentes (mot entier uniquement, jamais dans un nom de fichier). */
const TYPOS: Readonly<Record<string, string>> = {
  jai: "j'ai",
  ya: "y a",
  chui: "je suis",
  chuis: "je suis",
  kestu: "qu'est-ce que tu",
  keske: "qu'est-ce que",
  kes: "qu'est-ce",
  koi: "quoi",
  pk: "pourquoi",
  mels: "mails",
  slt: "salut",
  bjr: "bonjour",
  cc: "coucou",
  mrc: "merci",
  mci: "merci",
  dsl: "desole",
};

/** Préfixes « d'habillage » retirés en DERNIER recours (si rien n'a matché) : on réessaie le reste. */
const WRAPPERS =
  /^(?:je veux (?:voir )?|je voudrais (?:voir )?|j'aimerais (?:voir )?|fais (?:moi )?voir |fait voir |t'as |tu as |est-ce que j'ai |est ce que j'ai |y a |il y a |dis moi |donne moi |montre moi |affiche moi |c'est quoi |cherche moi )/u;
const TRAILING_SOFT =
  /(?: cote (?:mails?|github|fichiers)| (?:aujourd'hui|maintenant|actuellement|en ce moment|stp|svp))$/u;

export function normalizeIntentTextV2(text: string): string {
  let s = text
    .normalize("NFKD")
    // Marques + caractères de format (ex. U+200B) — IV2-07.
    .replace(/\p{M}+/gu, "")
    .replace(/\p{Cf}+/gu, "")
    .trim()
    .toLowerCase()
    .replace(/['’`]/gu, "'")
    .replace(
      /-(moi|toi|nous|vous|le|la|les|lui|leur|je|tu|il|elle|on|ils|elles)(?![a-z0-9])/gu,
      " $1",
    )
    .replace(/[?!,;:…«»"()]+/gu, " ")
    .replace(/\.+$/u, "")
    .replace(/\s+/gu, " ")
    .trim();
  const whole = s;
  s = s.replace(LEADING, "").replace(TRAILING, "").trim();
  if (s.length === 0) s = whole;
  return s.replace(
    /(?<![a-z0-9'])([a-z]+)(?![a-z0-9'])/gu,
    (w) => NUMBER_WORDS[w] ?? TYPOS[w] ?? w,
  );
}

const SLOT_RE = /\{(label|repo|folder|file|n|account|text)\}/gu;
const SLOT_CAPTURE: Readonly<Record<string, string>> = {
  n: "(\\d+)",
  repo: "([a-z0-9_.-]+(?:\\/[a-z0-9_.-]+)?)",
  label: "(.+)",
  folder: "(.+)",
  file: "(.+)",
  account: "(.+)",
  text: "(.+)",
};

function escapeRegExp(v: string): string {
  return v.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

export function countSlotsV2(phrase: string): number {
  return phrase.match(SLOT_RE)?.length ?? 0;
}

type Compiled = {
  readonly intent: IntentV2;
  readonly phrase: string;
  readonly re: RegExp;
  readonly slots: readonly string[];
  readonly literal: number;
  readonly order: number;
};

export type RouteV2 =
  | {
      readonly kind: "match";
      readonly id: string;
      readonly via: "exact" | "guard" | "pattern" | "slot-guard";
      readonly slots: Readonly<Record<string, string>>;
      readonly phrase?: string;
    }
  | { readonly kind: "unknown" };

export function sanitizeCaptureV2(raw: string): string {
  return (
    raw
      .replace(/\p{Cf}+/gu, "")
      // `\s+` obligatoire — sinon « de » mange le début de « dev ».
      .replace(/^(?:les|des|du|de|la|le|mes|mon|ma|un|une|l')\s+/u, "")
      .replace(/[»"'«.,!?]+$/gu, "")
      .trim()
  );
}

/**
 * IV2-03 — refuse les captures de chemin dangereuses (`..`, absolu, etc.).
 */
export function isUnsafePathCapture(raw: string): boolean {
  const value = raw.trim();
  if (value.length === 0) {
    return false;
  }
  if (value.includes("..")) {
    return true;
  }
  if (value.startsWith("/") || value.startsWith("~")) {
    return true;
  }
  if (/^[a-z]:[\\/]/i.test(value)) {
    return true;
  }
  if (/(^|[\\/])(?:etc|proc|sys|dev|var)([\\/]|$)/i.test(value)) {
    return true;
  }
  return false;
}

/** Valeurs connues (fournies par l'app : MailPort, GitHub, alias de dossiers). Si un slot de ce type ne correspond pas, le motif est ignoré. */
export type RouterContextV2 = {
  readonly accounts?: readonly string[];
  readonly labels?: readonly string[];
  readonly repos?: readonly string[];
};

export type RouterV2 = {
  route(text: string): RouteV2;
  readonly exactCollisions: readonly { key: string; ids: readonly string[] }[];
  readonly patterns: number;
  readonly exact: number;
};

export function createRouterV2(
  intents: readonly IntentV2[] = INTENTS_V2,
  ctx: RouterContextV2 = {},
): RouterV2 {
  const exact = new Map<string, string>();
  const collisions = new Map<string, Set<string>>();
  const patterns: Compiled[] = [];
  intents.forEach((intent, order) => {
    for (const phrase of [...intent.shortcuts, ...intent.phrases]) {
      const n = normalizeIntentTextV2(phrase);
      if (n.length === 0) continue;
      const slots = [...n.matchAll(SLOT_RE)].map((m) => m[1]!);
      if (slots.length === 0) {
        const prev = exact.get(n);
        if (prev !== undefined && prev !== intent.id) {
          collisions.set(
            n,
            new Set([...(collisions.get(n) ?? [prev]), intent.id]),
          );
          continue;
        }
        exact.set(n, intent.id);
        continue;
      }
      if (slots.length > MAX_PHRASE_SLOTS_V2) continue;
      let src = "";
      let last = 0;
      for (const m of n.matchAll(SLOT_RE)) {
        src += escapeRegExp(n.slice(last, m.index)) + SLOT_CAPTURE[m[1]!]!;
        last = m.index! + m[0].length;
      }
      src += escapeRegExp(n.slice(last));
      patterns.push({
        intent,
        phrase,
        re: new RegExp(`^${src}$`, "u"),
        slots,
        literal: n.replace(SLOT_RE, "").length,
        order,
      });
    }
  });
  patterns.sort(
    (a, b) =>
      b.literal - a.literal ||
      a.slots.length - b.slots.length ||
      a.order - b.order,
  );
  const known: Record<string, ReadonlySet<string> | undefined> = {
    account: ctx.accounts
      ? new Set(ctx.accounts.map(normalizeIntentTextV2))
      : undefined,
    repo: ctx.repos ? new Set(ctx.repos.map(normalizeIntentTextV2)) : undefined,
  };
  const VALUE_GUARDS = REFUSE_GUARDS_V2.filter(
    (g) =>
      ![
        "refuse.weather",
        "refuse.web",
        "refuse.calendar",
        "refuse.share",
      ].includes(g.id),
  );

  function routeNormalized(n: string): RouteV2 {
    const hit = exact.get(n);
    if (hit !== undefined)
      return { kind: "match", id: hit, via: "exact", slots: {} };
    for (const g of REFUSE_GUARDS_V2) {
      if (g.pattern.test(n))
        return { kind: "match", id: g.id, via: "guard", slots: {} };
    }
    for (const p of patterns) {
      const m = n.match(p.re);
      if (!m) continue;
      const values = m.slice(1).map((v) => sanitizeCaptureV2(v ?? ""));
      if (values.some((v) => v.length === 0 || v.length > 80)) continue;
      if (
        p.slots.some(
          (s, i) => known[s] !== undefined && !known[s]!.has(values[i]!),
        )
      )
        continue;
      const slots: Record<string, string> = {};
      p.slots.forEach((s, i) => {
        slots[s] = values[i]!;
      });
      for (let i = 0; i < p.slots.length; i++) {
        const slotName = p.slots[i]!;
        const v = values[i]!;
        if (
          (slotName === "folder" || slotName === "file") &&
          isUnsafePathCapture(v)
        ) {
          return {
            kind: "match",
            id: "refuse.write",
            via: "slot-guard",
            slots,
          };
        }
        // une valeur de slot ne doit jamais faire passer une action interdite (« … et lance npm install », « .env »)
        for (const g of VALUE_GUARDS)
          if (g.pattern.test(v))
            return { kind: "match", id: g.id, via: "slot-guard", slots };
        if (SLOT_NOTES_V2.test(v))
          return {
            kind: "match",
            id: "refuse.notes",
            via: "slot-guard",
            slots,
          };
        if (COMPOUND_GUARD_V2.test(` ${v} `))
          return {
            kind: "match",
            id: "conv.compound",
            via: "slot-guard",
            slots,
          };
      }
      return {
        kind: "match",
        id: p.intent.id,
        via: "pattern",
        slots,
        phrase: p.phrase,
      };
    }
    return { kind: "unknown" };
  }

  function route(text: string): RouteV2 {
    let n = normalizeIntentTextV2(text);
    if (n.length === 0) return { kind: "unknown" };
    let r = routeNormalized(n);
    // dernier recours : retirer l'habillage (« je veux voir… », « … côté mails ») puis réessayer, au plus 2 fois
    for (let k = 0; k < 2 && r.kind === "unknown"; k++) {
      const peeled = n.replace(WRAPPERS, "").replace(TRAILING_SOFT, "").trim();
      if (peeled === n || peeled.length === 0) break;
      n = peeled;
      r = routeNormalized(n);
    }
    return r;
  }

  return {
    route,
    exactCollisions: [...collisions].map(([key, ids]) => ({
      key,
      ids: [...ids],
    })),
    patterns: patterns.length,
    exact: exact.size,
  };
}
