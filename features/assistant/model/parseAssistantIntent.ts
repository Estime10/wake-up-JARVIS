import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import {
  matchCustomPhraseRule,
  type CustomPhraseRule,
} from "@/features/assistant/model/customPhraseRules";
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
import {
  REFUSE_WRITE_PATTERNS,
  REFUSE_WRITE_PHRASES,
} from "@/features/assistant/model/intents/refusePhrases";
import {
  matchPhraseCatalog,
  matchShortcuts,
} from "@/features/assistant/model/matchPhraseCatalog";
import { matchIntentPatterns } from "@/features/assistant/model/matchIntentPatterns";
import { MAIL_GENERIC_REJECT } from "@/features/assistant/model/intents/mailPhrases";

function labelFromCaptures(captures: readonly string[]): string | null {
  const candidates = captures.filter((value) => !/^\d+$/.test(value));
  const label = candidates[candidates.length - 1]?.trim();
  if (!label || MAIL_GENERIC_REJECT.test(label)) {
    return null;
  }
  return label;
}

function repoFromCaptures(captures: readonly string[]): string | undefined {
  const repo = captures.find((value) => !/^\d+$/.test(value))?.trim();
  if (
    !repo ||
    /^(repos?|projets?|github|pr|prs|commits?|branches?)$/i.test(repo)
  ) {
    return undefined;
  }
  return repo;
}

export type ParseAssistantIntentOptions = {
  customRules?: readonly CustomPhraseRule[];
};

function projectFromCaptures(captures: readonly string[]): string | undefined {
  const project = captures.find((value) => !/^\d+$/.test(value))?.trim();
  if (
    !project ||
    /^(supabase|studio|projet|projets|compte|comptes)$/i.test(project)
  ) {
    return undefined;
  }
  return project;
}

/**
 * Routeur d’intents — registre lecture seule (phrases d’exemple).
 * Priorité : custom → refus → help → chat → terminal → supabase → github UI → github → files → mail.
 */
export function parseAssistantIntent(
  text: string,
  options: ParseAssistantIntentOptions = {},
): AssistantIntent | null {
  const custom = matchCustomPhraseRule(text, options.customRules);
  if (custom) {
    return custom;
  }

  if (
    matchShortcuts(text, REFUSE_WRITE_PHRASES) ||
    matchPhraseCatalog(text, REFUSE_WRITE_PHRASES) ||
    matchIntentPatterns(text, REFUSE_WRITE_PATTERNS)
  ) {
    return { kind: "refuse.write" };
  }

  if (
    matchShortcuts(text, HELP_SHORTCUTS) ||
    matchPhraseCatalog(text, HELP_PHRASES)
  ) {
    return { kind: "help" };
  }

  if (
    matchShortcuts(text, THANKS_SHORTCUTS) ||
    matchPhraseCatalog(text, THANKS_PHRASES)
  ) {
    return { kind: "chat.thanks" };
  }

  if (
    matchShortcuts(text, HOW_ARE_YOU_SHORTCUTS) ||
    matchPhraseCatalog(text, HOW_ARE_YOU_PHRASES)
  ) {
    return { kind: "chat.how_are_you" };
  }

  if (
    matchShortcuts(text, GREETING_SHORTCUTS) ||
    matchPhraseCatalog(text, GREETING_PHRASES)
  ) {
    return { kind: "chat.greeting" };
  }

  if (
    matchShortcuts(text, TERMINAL_OPEN_SHORTCUTS) ||
    matchPhraseCatalog(text, TERMINAL_OPEN_PHRASES)
  ) {
    const hit = matchPhraseCatalog(text, TERMINAL_OPEN_PHRASES);
    const folder = hit?.captures[0];
    return folder
      ? { kind: "terminal.open", folder }
      : { kind: "terminal.open" };
  }

  if (
    matchShortcuts(text, SUPABASE_STUDIO_STOP_SHORTCUTS) ||
    matchPhraseCatalog(text, SUPABASE_STUDIO_STOP_PHRASES)
  ) {
    return { kind: "supabase.studio_stop" };
  }

  if (
    matchShortcuts(text, SUPABASE_STUDIO_SHORTCUTS) ||
    matchPhraseCatalog(text, SUPABASE_STUDIO_PHRASES)
  ) {
    const hit = matchPhraseCatalog(text, SUPABASE_STUDIO_PHRASES);
    const projectQuery = hit ? projectFromCaptures(hit.captures) : undefined;
    return {
      kind: "supabase.studio",
      ...(projectQuery ? { projectQuery } : {}),
    };
  }

  if (
    matchShortcuts(text, SUPABASE_LIST_SHORTCUTS) ||
    matchPhraseCatalog(text, SUPABASE_LIST_PHRASES)
  ) {
    return { kind: "supabase.list_projects" };
  }

  if (
    matchShortcuts(text, GITHUB_OPEN_PANEL_SHORTCUTS) ||
    matchPhraseCatalog(text, GITHUB_OPEN_PANEL_PHRASES)
  ) {
    return { kind: "github.open_panel" };
  }

  const openRepoHit = matchPhraseCatalog(text, GITHUB_OPEN_REPO_PHRASES);
  if (openRepoHit) {
    const repoQuery = repoFromCaptures(openRepoHit.captures);
    if (repoQuery) {
      return { kind: "github.open_repo", repoQuery };
    }
  }

  const findHit = matchPhraseCatalog(text, FILES_FIND_PHRASES);
  if (findHit && findHit.captures[0]) {
    const query = findHit.captures[0]!;
    const folder = findHit.captures[1];
    return folder
      ? { kind: "files.find", query, folder }
      : { kind: "files.find", query };
  }

  const gotoHit = matchPhraseCatalog(text, FILES_GOTO_PHRASES);
  if (gotoHit && gotoHit.captures[0]) {
    return { kind: "files.goto", folder: gotoHit.captures[0]! };
  }

  const openHit = matchPhraseCatalog(text, FILES_OPEN_PHRASES);
  if (openHit) {
    const query = openHit.captures[0];
    const revealInFinder = /finder/i.test(openHit.phrase);
    return {
      kind: "files.open",
      ...(query ? { query } : {}),
      ...(revealInFinder ? { revealInFinder: true } : {}),
    };
  }

  if (
    matchShortcuts(text, GITHUB_STATUS_SHORTCUTS) ||
    matchPhraseCatalog(text, GITHUB_STATUS_PHRASES)
  ) {
    return { kind: "github.status" };
  }

  if (
    matchShortcuts(text, GITHUB_PRS_SHORTCUTS) ||
    matchPhraseCatalog(text, GITHUB_PRS_PHRASES)
  ) {
    const hit = matchPhraseCatalog(text, GITHUB_PRS_PHRASES);
    const repoQuery = hit ? repoFromCaptures(hit.captures) : undefined;
    return { kind: "github.list_pulls", ...(repoQuery ? { repoQuery } : {}) };
  }

  if (
    matchShortcuts(text, GITHUB_COMMITS_SHORTCUTS) ||
    matchPhraseCatalog(text, GITHUB_COMMITS_PHRASES)
  ) {
    const hit = matchPhraseCatalog(text, GITHUB_COMMITS_PHRASES);
    const repoQuery = hit ? repoFromCaptures(hit.captures) : undefined;
    return {
      kind: "github.list_commits",
      ...(repoQuery ? { repoQuery } : {}),
    };
  }

  if (
    matchShortcuts(text, GITHUB_BRANCHES_SHORTCUTS) ||
    matchPhraseCatalog(text, GITHUB_BRANCHES_PHRASES)
  ) {
    const hit = matchPhraseCatalog(text, GITHUB_BRANCHES_PHRASES);
    const repoQuery = hit ? repoFromCaptures(hit.captures) : undefined;
    return {
      kind: "github.list_branches",
      ...(repoQuery ? { repoQuery } : {}),
    };
  }

  if (
    matchShortcuts(text, GITHUB_REPOS_SHORTCUTS) ||
    matchPhraseCatalog(text, GITHUB_REPOS_PHRASES)
  ) {
    return { kind: "github.list_repos" };
  }

  const sentByLabel = matchPhraseCatalog(text, MAIL_SENT_BY_LABEL_PHRASES);
  if (sentByLabel) {
    const label = labelFromCaptures(sentByLabel.captures);
    if (label) {
      return { kind: "mail.list_sent_by_label", label };
    }
  }

  if (
    matchShortcuts(text, MAIL_SENT_SHORTCUTS) ||
    matchPhraseCatalog(text, MAIL_SENT_PHRASES)
  ) {
    return { kind: "mail.list_sent" };
  }

  if (
    matchShortcuts(text, MAIL_FLAGGED_SHORTCUTS) ||
    matchPhraseCatalog(text, MAIL_FLAGGED_PHRASES)
  ) {
    return { kind: "mail.list_flagged" };
  }

  if (
    matchShortcuts(text, MAIL_OVERVIEW_SHORTCUTS) ||
    matchPhraseCatalog(text, MAIL_OVERVIEW_PHRASES)
  ) {
    return { kind: "mail.overview" };
  }

  if (
    matchShortcuts(text, MAIL_COUNT_SHORTCUTS) ||
    matchPhraseCatalog(text, MAIL_COUNT_PHRASES)
  ) {
    const hit = matchPhraseCatalog(text, MAIL_COUNT_PHRASES);
    const label = hit ? labelFromCaptures(hit.captures) : undefined;
    return label ? { kind: "mail.count", label } : { kind: "mail.count" };
  }

  if (
    matchShortcuts(text, MAIL_RECENT_SHORTCUTS) ||
    matchPhraseCatalog(text, MAIL_RECENT_PHRASES)
  ) {
    return { kind: "mail.list_recent" };
  }

  const byLabel = matchPhraseCatalog(text, MAIL_LABEL_PHRASES);
  if (byLabel) {
    const label = labelFromCaptures(byLabel.captures);
    if (label) {
      return { kind: "mail.list_by_label", label };
    }
  }

  return null;
}
