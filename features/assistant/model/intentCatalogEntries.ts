import type { IntentKind } from "@/features/assistant/model/intentKindOptions";
import {
  GITHUB_OPEN_PANEL_PHRASES,
  GITHUB_OPEN_PANEL_SHORTCUTS,
  GITHUB_OPEN_REPO_PHRASES,
} from "@/features/assistant/model/intents/githubUiPhrases";
import {
  SUPABASE_LIST_PHRASES,
  SUPABASE_LIST_SHORTCUTS,
  SUPABASE_STUDIO_PHRASES,
  SUPABASE_STUDIO_SHORTCUTS,
  SUPABASE_STUDIO_STOP_PHRASES,
  SUPABASE_STUDIO_STOP_SHORTCUTS,
} from "@/features/assistant/model/intents/supabasePhrases";
import { INTENTS_V2 } from "@/features/assistant/model/intents/v2/index.v2";
import { normalizeIntentText } from "@/features/assistant/model/normalizeIntentText";

export type CatalogEntry = {
  phrase: string;
  kind: IntentKind | "v2.local" | "v2.stub";
  source: "builtin" | "custom";
};

function pack(
  kind: CatalogEntry["kind"],
  phrases: readonly string[],
  source: CatalogEntry["source"] = "builtin",
): CatalogEntry[] {
  const seen = new Set<string>();
  const out: CatalogEntry[] = [];
  for (const phrase of phrases) {
    const key = normalizeIntentText(phrase);
    if (key.length === 0 || seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push({ phrase, kind, source });
  }
  return out;
}

function catalogKindForV2(
  id: string,
  appKind: string | null,
): CatalogEntry["kind"] {
  if (appKind && isKnownKind(appKind)) {
    return appKind;
  }
  if (id.startsWith("refuse.")) {
    return "refuse.write";
  }
  if (id === "ui.panel_repos") {
    return "github.open_panel";
  }
  if (id === "files.reveal_file") {
    return "files.open";
  }
  if (id === "files.list" || id === "files.reveal_folder") {
    return "files.goto";
  }
  if (id === "mail.count_label") {
    return "mail.count";
  }
  return "v2.local";
}

function isKnownKind(value: string): value is IntentKind {
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
    value === "github.open_panel" ||
    value === "github.open_repo" ||
    value === "terminal.open" ||
    value === "files.goto" ||
    value === "files.find" ||
    value === "files.open" ||
    value === "refuse.write"
  );
}

/** Catalogue builtin : phrases v2 + Supabase + GitHub UI legacy. */
export function listBuiltinCatalogEntries(): CatalogEntry[] {
  const fromV2 = INTENTS_V2.flatMap((intent) =>
    pack(catalogKindForV2(intent.id, intent.appKind), [
      ...intent.shortcuts,
      ...intent.phrases,
    ]),
  );

  return [
    ...fromV2,
    ...pack("github.open_panel", [
      ...GITHUB_OPEN_PANEL_SHORTCUTS,
      ...GITHUB_OPEN_PANEL_PHRASES,
    ]),
    ...pack("github.open_repo", GITHUB_OPEN_REPO_PHRASES),
    ...pack("supabase.list_projects", [
      ...SUPABASE_LIST_SHORTCUTS,
      ...SUPABASE_LIST_PHRASES,
    ]),
    ...pack("supabase.studio", [
      ...SUPABASE_STUDIO_SHORTCUTS,
      ...SUPABASE_STUDIO_PHRASES,
    ]),
    ...pack("supabase.studio_stop", [
      ...SUPABASE_STUDIO_STOP_SHORTCUTS,
      ...SUPABASE_STUDIO_STOP_PHRASES,
    ]),
  ];
}

export function filterCatalogEntries(
  entries: readonly CatalogEntry[],
  query: string,
): CatalogEntry[] {
  const q = normalizeIntentText(query);
  if (q.length === 0) {
    return [...entries];
  }
  return entries.filter(
    (entry) =>
      normalizeIntentText(entry.phrase).includes(q) ||
      entry.kind.toLowerCase().includes(q),
  );
}
