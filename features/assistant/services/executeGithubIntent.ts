import "server-only";

import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { resolveRepoQuery } from "@/features/assistant/model/resolveRepoQuery";
import {
  formatGithubBranchesReply,
  formatGithubCommitsReply,
  formatGithubPullsReply,
  formatGithubReposReply,
} from "@/features/assistant/services/formatGithubReplies";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { listGithubBranches } from "@/lib/github/listBranches";
import { listGithubCommits } from "@/lib/github/listCommits";
import { listGithubPulls } from "@/lib/github/listPulls";
import { listGithubRepos } from "@/lib/github/listRepos";
import { parseRepoId } from "@/lib/github/parseRepoId";
import { t } from "@/lib/i18n";
import { createLogger } from "@/lib/logger";

const log = createLogger("assistant.github");

type GithubIntent = Extract<AssistantIntent, { kind: `github.${string}` }>;

async function requireGithubToken(): Promise<
  { ok: true; token: string; login: string } | { ok: false; reply: string }
> {
  const loaded = await loadGithubConnectionToken();
  if (!loaded.ok) {
    log.warn("token_unavailable", { reason: loaded.reason });
    if (loaded.reason === "missing" || loaded.reason === "auth") {
      return { ok: false, reply: t("assistant.githubNotConnected") };
    }
    if (loaded.reason === "needs_reauth") {
      return { ok: false, reply: t("assistant.githubNeedsReauth") };
    }
    return { ok: false, reply: t("assistant.githubUnavailable") };
  }
  return { ok: true, token: loaded.token, login: loaded.login };
}

async function resolveRepo(
  token: string,
  repoQuery: string,
): Promise<
  | { ok: true; owner: string; repo: string; id: string; defaultBranch: string }
  | { ok: false; reply: string }
> {
  const listed = await listGithubRepos(token);
  if (!listed.ok) {
    return { ok: false, reply: t("assistant.githubUnavailable") };
  }
  const match = resolveRepoQuery(repoQuery, listed.repos);
  if (!match) {
    return {
      ok: false,
      reply: t("assistant.githubRepoNotFound", { repo: repoQuery }),
    };
  }
  const parsed = parseRepoId(match.id);
  if (!parsed) {
    return { ok: false, reply: t("assistant.githubUnavailable") };
  }
  return {
    ok: true,
    owner: parsed.owner,
    repo: parsed.repo,
    id: match.id,
    defaultBranch: match.defaultBranch,
  };
}

export async function executeGithubIntent(
  intent: GithubIntent,
): Promise<string> {
  const auth = await requireGithubToken();
  if (!auth.ok) {
    return auth.reply;
  }

  if (intent.kind === "github.status") {
    return t("assistant.githubStatusOk", { login: auth.login });
  }

  if (intent.kind === "github.list_repos") {
    const listed = await listGithubRepos(auth.token);
    if (!listed.ok) {
      return t("assistant.githubUnavailable");
    }
    return formatGithubReposReply(listed.repos);
  }

  if (!intent.repoQuery) {
    return t("assistant.githubRepoRequired");
  }

  const resolved = await resolveRepo(auth.token, intent.repoQuery);
  if (!resolved.ok) {
    return resolved.reply;
  }

  if (intent.kind === "github.list_pulls") {
    const pulls = await listGithubPulls(
      auth.token,
      resolved.owner,
      resolved.repo,
    );
    if (!pulls.ok) {
      return t("assistant.githubUnavailable");
    }
    return formatGithubPullsReply(resolved.id, pulls.pulls);
  }

  if (intent.kind === "github.list_commits") {
    const commits = await listGithubCommits(
      auth.token,
      resolved.owner,
      resolved.repo,
      resolved.defaultBranch,
    );
    if (!commits.ok) {
      return t("assistant.githubUnavailable");
    }
    return formatGithubCommitsReply(resolved.id, commits.commits);
  }

  const branches = await listGithubBranches(
    auth.token,
    resolved.owner,
    resolved.repo,
    resolved.defaultBranch,
  );
  if (!branches.ok) {
    return t("assistant.githubUnavailable");
  }
  return formatGithubBranchesReply(resolved.id, branches.branches);
}

export function isGithubIntent(
  intent: AssistantIntent,
): intent is GithubIntent {
  return intent.kind.startsWith("github.");
}
