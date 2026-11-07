import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import {
  matchCustomPhraseRule,
  type CustomPhraseRule,
} from "@/features/assistant/model/customPhraseRules";
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
import { intentsV2WithOverlays } from "@/features/assistant/model/intents/v2/extendIntentsV2";
import { createRouterV2 } from "@/features/assistant/model/intents/v2/routeIntentV2";
import { mapIntentV2ToAssistant } from "@/features/assistant/model/mapIntentV2ToAssistant";
import {
  matchPhraseCatalog,
  matchShortcuts,
} from "@/features/assistant/model/matchPhraseCatalog";

const routerV2 = createRouterV2(intentsV2WithOverlays());

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

/**
 * Routeur intents — custom → Supabase (hors v2) → GitHub UI legacy → catalogue v2.
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

  return mapIntentV2ToAssistant(routerV2.route(text));
}
