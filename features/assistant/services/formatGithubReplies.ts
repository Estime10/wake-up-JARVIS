import type {
  RepoBranch,
  RepoCommit,
  RepoPull,
  RepoSummary,
} from "@/lib/schemas";
import { t } from "@/lib/i18n";

export function formatGithubReposReply(repos: readonly RepoSummary[]): string {
  if (repos.length === 0) {
    return t("assistant.githubReposEmpty");
  }
  const lines = repos.slice(0, 30).map((repo, index) => {
    const visibility = repo.private ? "privé" : "public";
    return `${index + 1}. ${repo.id.toLocaleUpperCase("fr-FR")}\n${visibility} · ${repo.defaultBranch}`;
  });
  const header =
    repos.length === 1
      ? t("assistant.githubReposOne")
      : t("assistant.githubReposMany", { count: repos.length });
  return `${header}\n${lines.join("\n\n")}`;
}

export function formatGithubPullsReply(
  repoId: string,
  pulls: readonly RepoPull[],
): string {
  if (pulls.length === 0) {
    return t("assistant.githubPullsEmpty", { repo: repoId });
  }
  const lines = pulls.slice(0, 20).map((pull, index) => {
    return `${index + 1}. ${pull.author.toLocaleUpperCase("fr-FR")}\n#${pull.number} · ${pull.title}`;
  });
  const header = t("assistant.githubPullsMany", {
    count: pulls.length,
    repo: repoId,
  });
  return `${header}\n${lines.join("\n\n")}`;
}

export function formatGithubCommitsReply(
  repoId: string,
  commits: readonly RepoCommit[],
): string {
  if (commits.length === 0) {
    return t("assistant.githubCommitsEmpty", { repo: repoId });
  }
  const lines = commits.slice(0, 20).map((commit, index) => {
    const firstLine = commit.message.split("\n")[0]?.trim() || commit.sha;
    return `${index + 1}. ${commit.author.toLocaleUpperCase("fr-FR")}\n${firstLine} · ${commit.relativeTime}`;
  });
  const header = t("assistant.githubCommitsMany", {
    count: commits.length,
    repo: repoId,
  });
  return `${header}\n${lines.join("\n\n")}`;
}

export function formatGithubBranchesReply(
  repoId: string,
  branches: readonly RepoBranch[],
): string {
  if (branches.length === 0) {
    return t("assistant.githubBranchesEmpty", { repo: repoId });
  }
  const lines = branches.slice(0, 40).map((branch, index) => {
    const mark = branch.isDefault
      ? " (défaut)"
      : branch.protected
        ? " (protégée)"
        : "";
    return `${index + 1}. ${branch.name.toLocaleUpperCase("fr-FR")}${mark}`;
  });
  const header = t("assistant.githubBranchesMany", {
    count: branches.length,
    repo: repoId,
  });
  return `${header}\n${lines.join("\n")}`;
}
