import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import {
  GITHUB_LIST_BRANCHES_PATTERNS,
  GITHUB_LIST_COMMITS_PATTERNS,
  GITHUB_LIST_PULLS_PATTERNS,
  GITHUB_LIST_REPOS_PATTERNS,
  GITHUB_STATUS_PATTERNS,
} from "@/features/assistant/model/intents/githubIntentCatalog";
import {
  matchIntentPatterns,
  sanitizeCapturedToken,
} from "@/features/assistant/model/matchIntentPatterns";

function repoFromMatch(match: RegExpMatchArray): string | null {
  const raw = match[1]?.trim();
  if (!raw) {
    return null;
  }
  const repo = sanitizeCapturedToken(raw);
  if (
    !repo ||
    /^(repos?|projets?|github|pr|prs|commits?|branches?)$/i.test(repo)
  ) {
    return null;
  }
  return repo;
}

/**
 * Intents GitHub — ordre : status → pulls → commits → branches → list repos.
 * (PRs/commits/branches avant list repos pour ne pas manger « liste les PR sur X ».)
 */
export function parseGithubIntents(text: string): AssistantIntent | null {
  if (matchIntentPatterns(text, GITHUB_STATUS_PATTERNS)) {
    return { kind: "github.status" };
  }

  const pulls = matchIntentPatterns(text, GITHUB_LIST_PULLS_PATTERNS);
  if (pulls) {
    const repoQuery = repoFromMatch(pulls);
    if (repoQuery) {
      return { kind: "github.list_pulls", repoQuery };
    }
  }

  const commits = matchIntentPatterns(text, GITHUB_LIST_COMMITS_PATTERNS);
  if (commits) {
    const repoQuery = repoFromMatch(commits);
    if (repoQuery) {
      return { kind: "github.list_commits", repoQuery };
    }
  }

  const branches = matchIntentPatterns(text, GITHUB_LIST_BRANCHES_PATTERNS);
  if (branches) {
    const repoQuery = repoFromMatch(branches);
    if (repoQuery) {
      return { kind: "github.list_branches", repoQuery };
    }
  }

  if (matchIntentPatterns(text, GITHUB_LIST_REPOS_PATTERNS)) {
    return { kind: "github.list_repos" };
  }

  return null;
}
