import "server-only";

import { z } from "zod";

import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { resolveRepoQuery } from "@/features/assistant/model/resolveRepoQuery";
import {
  formatGithubActivityReply,
  formatGithubBranchesReply,
  formatGithubCommitsReply,
  formatGithubFilesReply,
  formatGithubPullsReply,
  formatGithubRepoInfoReply,
  formatGithubReposReply,
} from "@/features/assistant/services/formatGithubReplies";
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { getGithubFileContent } from "@/lib/github/getFileContent";
import { listGithubBranches } from "@/lib/github/listBranches";
import { listGithubCommits } from "@/lib/github/listCommits";
import { listGithubPulls } from "@/lib/github/listPulls";
import { listGithubRepos } from "@/lib/github/listRepos";
import { listGithubTree } from "@/lib/github/listTree";
import { parseRepoId } from "@/lib/github/parseRepoId";
import { githubGet } from "@/lib/github/request";
import { t } from "@/lib/i18n";
import { createLogger } from "@/lib/logger";
import type { RepoTreeNode } from "@/lib/schemas";

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

function flattenTreePaths(
  nodes: readonly RepoTreeNode[],
  prefix = "",
): string[] {
  const paths: string[] = [];
  for (const node of nodes) {
    const path = prefix ? `${prefix}/${node.name}` : node.name;
    if (node.kind === "file") {
      paths.push(path);
    } else {
      paths.push(...flattenTreePaths(node.children, path));
    }
  }
  return paths;
}

export async function executeGithubIntent(
  intent: GithubIntent,
): Promise<string> {
  if (intent.kind === "github.open_panel") {
    return t("assistant.githubOpenPanel");
  }
  if (intent.kind === "github.open_repo") {
    return t("assistant.githubOpenRepo", { repo: intent.repoQuery });
  }

  const auth = await requireGithubToken();
  if (!auth.ok) {
    return auth.reply;
  }

  if (intent.kind === "github.status") {
    return t("assistant.githubStatusOk", { login: auth.login });
  }

  if (
    intent.kind === "github.list_repos" ||
    intent.kind === "github.activity"
  ) {
    const listed = await listGithubRepos(auth.token);
    if (!listed.ok) {
      return t("assistant.githubUnavailable");
    }
    if (intent.kind === "github.activity") {
      return formatGithubActivityReply(listed.repos);
    }
    return formatGithubReposReply(listed.repos);
  }

  if (intent.kind === "github.repo_info") {
    const listed = await listGithubRepos(auth.token);
    if (!listed.ok) {
      return t("assistant.githubUnavailable");
    }
    const match = resolveRepoQuery(intent.repoQuery, listed.repos);
    if (!match) {
      return t("assistant.githubRepoNotFound", { repo: intent.repoQuery });
    }
    return formatGithubRepoInfoReply(match);
  }

  if (!("repoQuery" in intent) || !intent.repoQuery) {
    if (intent.kind === "github.list_pulls") {
      return t("assistant.githubRepoRequired");
    }
    if (
      intent.kind === "github.prs_closed" ||
      intent.kind === "github.commit_last" ||
      intent.kind === "github.list_commits" ||
      intent.kind === "github.list_branches"
    ) {
      return t("assistant.githubRepoRequired");
    }
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
      "open",
    );
    if (!pulls.ok) {
      return t("assistant.githubUnavailable");
    }
    return formatGithubPullsReply(resolved.id, pulls.pulls);
  }

  if (intent.kind === "github.prs_closed") {
    const pulls = await listGithubPulls(
      auth.token,
      resolved.owner,
      resolved.repo,
      "closed",
    );
    if (!pulls.ok) {
      return t("assistant.githubUnavailable");
    }
    return formatGithubPullsReply(resolved.id, pulls.pulls, { closed: true });
  }

  if (intent.kind === "github.pr_detail") {
    const result = await githubGet(
      auth.token,
      `/repos/${encodeURIComponent(resolved.owner)}/${encodeURIComponent(resolved.repo)}/pulls/${intent.n}`,
    );
    if (!result.ok) {
      return t("assistant.githubPrDetailMissing", {
        n: intent.n,
        repo: resolved.id,
      });
    }
    let json: unknown;
    try {
      json = await result.response.json();
    } catch {
      return t("assistant.githubUnavailable");
    }
    const parsed = z
      .object({
        number: z.number(),
        title: z.string(),
        state: z.string(),
        user: z.object({ login: z.string() }).nullable().optional(),
      })
      .safeParse(json);
    if (!parsed.success) {
      return t("assistant.githubUnavailable");
    }
    return t("assistant.githubPrDetailOk", {
      n: parsed.data.number,
      repo: resolved.id,
      title: parsed.data.title,
      author: parsed.data.user?.login ?? "unknown",
      state: parsed.data.state,
    });
  }

  if (
    intent.kind === "github.list_commits" ||
    intent.kind === "github.commit_last"
  ) {
    const commits = await listGithubCommits(
      auth.token,
      resolved.owner,
      resolved.repo,
      resolved.defaultBranch,
    );
    if (!commits.ok) {
      return t("assistant.githubUnavailable");
    }
    if (intent.kind === "github.commit_last") {
      const last = commits.commits[0];
      if (!last) {
        return t("assistant.githubCommitsEmpty", { repo: resolved.id });
      }
      const message = last.message.split("\n")[0]?.trim() || last.sha;
      return t("assistant.githubCommitLastOk", {
        repo: resolved.id,
        message,
        author: last.author,
        when: last.relativeTime,
      });
    }
    return formatGithubCommitsReply(resolved.id, commits.commits);
  }

  if (intent.kind === "github.files") {
    const tree = await listGithubTree(
      auth.token,
      resolved.owner,
      resolved.repo,
      resolved.defaultBranch,
    );
    if (!tree.ok) {
      return t("assistant.githubUnavailable");
    }
    return formatGithubFilesReply(resolved.id, flattenTreePaths(tree.tree));
  }

  if (intent.kind === "github.file_preview") {
    const file = await getGithubFileContent(
      auth.token,
      resolved.owner,
      resolved.repo,
      intent.file,
      resolved.defaultBranch,
    );
    if (!file.ok) {
      return t("assistant.githubFileMissing", {
        file: intent.file,
        repo: resolved.id,
      });
    }
    if (file.file.kind === "binary" || file.file.kind === "tooLarge") {
      return t("assistant.githubFileBinary", { file: intent.file });
    }
    const body =
      file.file.kind === "nominal" || file.file.kind === "empty"
        ? (file.file.content ?? "").trim()
        : "";
    if (!body) {
      return t("assistant.githubFileBinary", { file: intent.file });
    }
    const preview = body.length > 1200 ? `${body.slice(0, 1200)}…` : body;
    return t("assistant.githubFilePreviewOk", {
      file: intent.file,
      repo: resolved.id,
      preview,
    });
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
