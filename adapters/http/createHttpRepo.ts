import { parseRepoId } from "@/lib/github/parseRepoId";
import { ROUTES } from "@/lib/routes";
import {
  repoBranchSchema,
  repoCommitSchema,
  repoFileContentSchema,
  repoPullSchema,
  repoSummarySchema,
  type RepoBranch,
  type RepoCommit,
  type RepoFileContent,
  type RepoPull,
  type RepoSummary,
  type RepoTreeNode,
} from "@/lib/schemas";
import type { RepoPort } from "@/ports/repo-port";

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

/**
 * RepoPort navigateur → routes `/api/github/*` (PAT côté serveur).
 */
export function createHttpRepo(): RepoPort {
  return {
    async listRepos(): Promise<RepoSummary[]> {
      const response = await fetch(ROUTES.githubRepos, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("repos_failed");
      }
      const json = (await readJson(response)) as {
        ok?: boolean;
        repos?: unknown[];
      };
      if (!json.ok || !Array.isArray(json.repos)) {
        throw new Error("repos_failed");
      }
      return json.repos.map((item) => repoSummarySchema.parse(item));
    },

    async listBranches(repoId, defaultBranch): Promise<RepoBranch[]> {
      const parsed = parseRepoId(repoId);
      if (!parsed) {
        throw new Error("repo_id");
      }
      const url = new URL(
        ROUTES.githubRepoBranches(parsed.owner, parsed.repo),
        window.location.origin,
      );
      url.searchParams.set("default", defaultBranch);
      const response = await fetch(url.pathname + url.search, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("branches_failed");
      }
      const json = (await readJson(response)) as {
        ok?: boolean;
        branches?: unknown[];
      };
      if (!json.ok || !Array.isArray(json.branches)) {
        throw new Error("branches_failed");
      }
      return json.branches.map((item) => repoBranchSchema.parse(item));
    },

    async listTree(repoId, ref): Promise<RepoTreeNode[]> {
      const parsed = parseRepoId(repoId);
      if (!parsed) {
        throw new Error("repo_id");
      }
      const url = new URL(
        ROUTES.githubRepoTree(parsed.owner, parsed.repo),
        window.location.origin,
      );
      if (ref) {
        url.searchParams.set("ref", ref);
      }
      const response = await fetch(url.pathname + url.search, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("tree_failed");
      }
      const json = (await readJson(response)) as {
        ok?: boolean;
        tree?: RepoTreeNode[];
      };
      if (!json.ok || !Array.isArray(json.tree)) {
        throw new Error("tree_failed");
      }
      return json.tree;
    },

    async listCommits(repoId, ref): Promise<RepoCommit[]> {
      const parsed = parseRepoId(repoId);
      if (!parsed) {
        throw new Error("repo_id");
      }
      const url = new URL(
        ROUTES.githubRepoCommits(parsed.owner, parsed.repo),
        window.location.origin,
      );
      if (ref) {
        url.searchParams.set("ref", ref);
      }
      const response = await fetch(url.pathname + url.search, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("commits_failed");
      }
      const json = (await readJson(response)) as {
        ok?: boolean;
        commits?: unknown[];
      };
      if (!json.ok || !Array.isArray(json.commits)) {
        throw new Error("commits_failed");
      }
      return json.commits.map((item) => repoCommitSchema.parse(item));
    },

    async listPulls(repoId): Promise<RepoPull[]> {
      const parsed = parseRepoId(repoId);
      if (!parsed) {
        throw new Error("repo_id");
      }
      const response = await fetch(
        ROUTES.githubRepoPulls(parsed.owner, parsed.repo),
        { credentials: "same-origin" },
      );
      if (!response.ok) {
        throw new Error("pulls_failed");
      }
      const json = (await readJson(response)) as {
        ok?: boolean;
        pulls?: unknown[];
      };
      if (!json.ok || !Array.isArray(json.pulls)) {
        throw new Error("pulls_failed");
      }
      return json.pulls.map((item) => repoPullSchema.parse(item));
    },

    async getFile(repoId, path, ref): Promise<RepoFileContent> {
      const parsed = parseRepoId(repoId);
      if (!parsed) {
        throw new Error("repo_id");
      }
      const url = new URL(
        ROUTES.githubRepoContents(parsed.owner, parsed.repo),
        window.location.origin,
      );
      url.searchParams.set("path", path);
      if (ref) {
        url.searchParams.set("ref", ref);
      }
      const response = await fetch(url.pathname + url.search, {
        credentials: "same-origin",
      });
      if (!response.ok) {
        throw new Error("file_failed");
      }
      const json = (await readJson(response)) as {
        ok?: boolean;
        file?: unknown;
      };
      if (!json.ok || !json.file) {
        throw new Error("file_failed");
      }
      return repoFileContentSchema.parse(json.file);
    },
  };
}
