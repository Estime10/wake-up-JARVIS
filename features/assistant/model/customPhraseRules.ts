import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import type { IntentKind } from "@/features/assistant/model/intentKindOptions";
import { countPhraseSlots } from "@/features/assistant/model/matchPhraseCatalog";
import { normalizeIntentText } from "@/features/assistant/model/normalizeIntentText";

const STORAGE_KEY = "jarvis.customIntentPhrases.v1";

export type CustomPhraseRule = {
  id: string;
  phrase: string;
  kind: IntentKind;
  label?: string;
  repoQuery?: string;
  folder?: string;
  query?: string;
};

function isIntentKind(value: string): value is IntentKind {
  return (
    value === "help" ||
    value === "chat.greeting" ||
    value === "chat.how_are_you" ||
    value === "chat.thanks" ||
    value === "mail.list_recent" ||
    value === "mail.overview" ||
    value === "mail.count" ||
    value === "mail.list_by_label" ||
    value === "mail.list_sent" ||
    value === "mail.list_sent_by_label" ||
    value === "mail.list_flagged" ||
    value === "github.status" ||
    value === "github.list_repos" ||
    value === "github.list_pulls" ||
    value === "github.list_commits" ||
    value === "github.list_branches" ||
    value === "terminal.open" ||
    value === "files.goto" ||
    value === "files.find" ||
    value === "files.open" ||
    value === "refuse.write"
  );
}

/** Valide un payload JSON/API → règles custom. */
export function coerceCustomPhraseRules(raw: unknown): CustomPhraseRule[] {
  return parseRules(raw);
}

function parseRules(raw: unknown): CustomPhraseRule[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: CustomPhraseRule[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as Record<string, unknown>;
    if (typeof row.id !== "string" || typeof row.phrase !== "string") {
      continue;
    }
    if (typeof row.kind !== "string" || !isIntentKind(row.kind)) {
      continue;
    }
    if (countPhraseSlots(row.phrase) > 2) {
      continue;
    }
    const rule: CustomPhraseRule = {
      id: row.id,
      phrase: row.phrase,
      kind: row.kind,
    };
    if (typeof row.label === "string" && row.label.trim()) {
      rule.label = row.label.trim();
    }
    if (typeof row.repoQuery === "string" && row.repoQuery.trim()) {
      rule.repoQuery = row.repoQuery.trim();
    }
    if (typeof row.folder === "string" && row.folder.trim()) {
      rule.folder = row.folder.trim();
    }
    if (typeof row.query === "string" && row.query.trim()) {
      rule.query = row.query.trim();
    }
    out.push(rule);
  }
  return out;
}

export function loadCustomPhraseRules(): CustomPhraseRule[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return parseRules(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function saveCustomPhraseRules(
  rules: readonly CustomPhraseRule[],
): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function addCustomPhraseRule(
  input: Omit<CustomPhraseRule, "id">,
): CustomPhraseRule[] {
  const phrase = input.phrase.trim();
  if (phrase.length === 0 || countPhraseSlots(phrase) > 2) {
    return loadCustomPhraseRules();
  }
  const next: CustomPhraseRule = {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    phrase,
    kind: input.kind,
    ...(input.label ? { label: input.label } : {}),
    ...(input.repoQuery ? { repoQuery: input.repoQuery } : {}),
    ...(input.folder ? { folder: input.folder } : {}),
    ...(input.query ? { query: input.query } : {}),
  };
  const rules = [
    next,
    ...loadCustomPhraseRules().filter(
      (rule) =>
        normalizeIntentText(rule.phrase) !== normalizeIntentText(phrase),
    ),
  ];
  saveCustomPhraseRules(rules);
  return rules;
}

export function ruleToIntent(rule: CustomPhraseRule): AssistantIntent | null {
  switch (rule.kind) {
    case "help":
      return { kind: "help" };
    case "chat.greeting":
      return { kind: "chat.greeting" };
    case "chat.how_are_you":
      return { kind: "chat.how_are_you" };
    case "chat.thanks":
      return { kind: "chat.thanks" };
    case "mail.list_recent":
      return { kind: "mail.list_recent" };
    case "mail.overview":
      return { kind: "mail.overview" };
    case "mail.count":
      return rule.label
        ? { kind: "mail.count", label: rule.label }
        : { kind: "mail.count" };
    case "mail.list_by_label":
      return rule.label
        ? { kind: "mail.list_by_label", label: rule.label }
        : null;
    case "mail.list_sent":
      return { kind: "mail.list_sent" };
    case "mail.list_sent_by_label":
      return rule.label
        ? { kind: "mail.list_sent_by_label", label: rule.label }
        : null;
    case "mail.list_flagged":
      return { kind: "mail.list_flagged" };
    case "github.status":
      return { kind: "github.status" };
    case "github.list_repos":
      return { kind: "github.list_repos" };
    case "github.list_pulls":
      return rule.repoQuery
        ? { kind: "github.list_pulls", repoQuery: rule.repoQuery }
        : { kind: "github.list_pulls" };
    case "github.list_commits":
      return rule.repoQuery
        ? { kind: "github.list_commits", repoQuery: rule.repoQuery }
        : { kind: "github.list_commits" };
    case "github.list_branches":
      return rule.repoQuery
        ? { kind: "github.list_branches", repoQuery: rule.repoQuery }
        : { kind: "github.list_branches" };
    case "terminal.open":
      return rule.folder
        ? { kind: "terminal.open", folder: rule.folder }
        : { kind: "terminal.open" };
    case "files.goto":
      return rule.folder ? { kind: "files.goto", folder: rule.folder } : null;
    case "files.find":
      return rule.query
        ? rule.folder
          ? { kind: "files.find", query: rule.query, folder: rule.folder }
          : { kind: "files.find", query: rule.query }
        : null;
    case "files.open":
      return rule.query
        ? { kind: "files.open", query: rule.query }
        : { kind: "files.open" };
    case "refuse.write":
      return { kind: "refuse.write" };
  }
}

export function matchCustomPhraseRule(
  text: string,
  rules?: readonly CustomPhraseRule[],
): AssistantIntent | null {
  const list =
    rules ?? (typeof window === "undefined" ? [] : loadCustomPhraseRules());
  const normalized = normalizeIntentText(text);
  if (normalized.length === 0) {
    return null;
  }
  for (const rule of list) {
    if (normalizeIntentText(rule.phrase) === normalized) {
      return ruleToIntent(rule);
    }
  }
  return null;
}
