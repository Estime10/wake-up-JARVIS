import type { IntentKind } from "@/features/assistant/model/intentKindOptions";
import {
  GREETING_PHRASES,
  GREETING_SHORTCUTS,
  HOW_ARE_YOU_PHRASES,
  HOW_ARE_YOU_SHORTCUTS,
  THANKS_PHRASES,
  THANKS_SHORTCUTS,
} from "@/features/assistant/model/intents/chatPhrases";
import {
  FILES_FIND_PHRASES,
  FILES_GOTO_PHRASES,
  FILES_OPEN_PHRASES,
  TERMINAL_OPEN_PHRASES,
  TERMINAL_OPEN_SHORTCUTS,
} from "@/features/assistant/model/intents/filesPhrases";
import {
  GITHUB_BRANCHES_PHRASES,
  GITHUB_BRANCHES_SHORTCUTS,
  GITHUB_COMMITS_PHRASES,
  GITHUB_COMMITS_SHORTCUTS,
  GITHUB_PRS_PHRASES,
  GITHUB_PRS_SHORTCUTS,
  GITHUB_REPOS_PHRASES,
  GITHUB_REPOS_SHORTCUTS,
  GITHUB_STATUS_PHRASES,
  GITHUB_STATUS_SHORTCUTS,
} from "@/features/assistant/model/intents/githubPhrases";
import {
  HELP_PHRASES,
  HELP_SHORTCUTS,
} from "@/features/assistant/model/intents/helpPhrases";
import {
  MAIL_COUNT_PHRASES,
  MAIL_COUNT_SHORTCUTS,
  MAIL_FLAGGED_PHRASES,
  MAIL_FLAGGED_SHORTCUTS,
  MAIL_LABEL_PHRASES,
  MAIL_OVERVIEW_PHRASES,
  MAIL_OVERVIEW_SHORTCUTS,
  MAIL_RECENT_PHRASES,
  MAIL_RECENT_SHORTCUTS,
  MAIL_SENT_BY_LABEL_PHRASES,
  MAIL_SENT_PHRASES,
  MAIL_SENT_SHORTCUTS,
} from "@/features/assistant/model/intents/mailPhrases";
import { REFUSE_WRITE_PHRASES } from "@/features/assistant/model/intents/refusePhrases";
import { normalizeIntentText } from "@/features/assistant/model/normalizeIntentText";

export type CatalogEntry = {
  phrase: string;
  kind: IntentKind;
  source: "builtin" | "custom";
};

function pack(
  kind: IntentKind,
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

/** Catalogue builtin aplati (phrases + raccourcis). */
export function listBuiltinCatalogEntries(): CatalogEntry[] {
  return [
    ...pack("help", [...HELP_SHORTCUTS, ...HELP_PHRASES]),
    ...pack("chat.greeting", [...GREETING_SHORTCUTS, ...GREETING_PHRASES]),
    ...pack("chat.how_are_you", [
      ...HOW_ARE_YOU_SHORTCUTS,
      ...HOW_ARE_YOU_PHRASES,
    ]),
    ...pack("chat.thanks", [...THANKS_SHORTCUTS, ...THANKS_PHRASES]),
    ...pack("mail.list_recent", [
      ...MAIL_RECENT_SHORTCUTS,
      ...MAIL_RECENT_PHRASES,
    ]),
    ...pack("mail.overview", [
      ...MAIL_OVERVIEW_SHORTCUTS,
      ...MAIL_OVERVIEW_PHRASES,
    ]),
    ...pack("mail.count", [...MAIL_COUNT_SHORTCUTS, ...MAIL_COUNT_PHRASES]),
    ...pack("mail.list_by_label", MAIL_LABEL_PHRASES),
    ...pack("mail.list_sent", [...MAIL_SENT_SHORTCUTS, ...MAIL_SENT_PHRASES]),
    ...pack("mail.list_sent_by_label", MAIL_SENT_BY_LABEL_PHRASES),
    ...pack("mail.list_flagged", [
      ...MAIL_FLAGGED_SHORTCUTS,
      ...MAIL_FLAGGED_PHRASES,
    ]),
    ...pack("github.status", [
      ...GITHUB_STATUS_SHORTCUTS,
      ...GITHUB_STATUS_PHRASES,
    ]),
    ...pack("github.list_repos", [
      ...GITHUB_REPOS_SHORTCUTS,
      ...GITHUB_REPOS_PHRASES,
    ]),
    ...pack("github.list_pulls", [
      ...GITHUB_PRS_SHORTCUTS,
      ...GITHUB_PRS_PHRASES,
    ]),
    ...pack("github.list_commits", [
      ...GITHUB_COMMITS_SHORTCUTS,
      ...GITHUB_COMMITS_PHRASES,
    ]),
    ...pack("github.list_branches", [
      ...GITHUB_BRANCHES_SHORTCUTS,
      ...GITHUB_BRANCHES_PHRASES,
    ]),
    ...pack("terminal.open", [
      ...TERMINAL_OPEN_SHORTCUTS,
      ...TERMINAL_OPEN_PHRASES,
    ]),
    ...pack("files.goto", FILES_GOTO_PHRASES),
    ...pack("files.find", FILES_FIND_PHRASES),
    ...pack("files.open", FILES_OPEN_PHRASES),
    ...pack("refuse.write", REFUSE_WRITE_PHRASES),
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
