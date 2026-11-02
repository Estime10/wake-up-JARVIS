import { MOCK_REPOS, type MockRepoNode } from "@/fixtures/repos";
import type {
  RepoBranch,
  RepoFileContent,
  RepoSummary,
  RepoTreeNode,
} from "@/lib/schemas";
import type { RepoPort } from "@/ports/repo-port";

function mapTree(nodes: MockRepoNode[]): RepoTreeNode[] {
  return nodes.map((node) => {
    if (node.kind === "dir") {
      return {
        kind: "dir" as const,
        name: node.name,
        children: mapTree(node.children),
      };
    }
    return {
      kind: "file" as const,
      name: node.name,
      ...(node.sizeLabel ? { sizeLabel: node.sizeLabel } : {}),
      ...(node.protected ? { protected: true } : {}),
    };
  });
}

function findFile(nodes: MockRepoNode[], parts: string[]): MockRepoNode | null {
  if (parts.length === 0) {
    return null;
  }
  const [head, ...rest] = parts;
  const node = nodes.find((item) => item.name === head);
  if (!node) {
    return null;
  }
  if (rest.length === 0) {
    return node;
  }
  if (node.kind !== "dir") {
    return null;
  }
  return findFile(node.children, rest);
}

/** Adapter mock — fixtures panneau REPO. */
export function createMockRepo(): RepoPort {
  return {
    async listRepos(): Promise<RepoSummary[]> {
      return MOCK_REPOS.map((repo) => ({
        id: repo.id,
        name: repo.name,
        owner: "mock",
        private: false,
        defaultBranch: repo.branch,
        updatedAt: new Date().toISOString(),
      }));
    },

    async listBranches(repoId, defaultBranch): Promise<RepoBranch[]> {
      const repo = MOCK_REPOS.find((item) => item.id === repoId);
      const name = repo?.branch ?? defaultBranch;
      return [
        {
          name,
          protected: false,
          isDefault: true,
        },
      ];
    },

    async listTree(repoId) {
      const repo = MOCK_REPOS.find((item) => item.id === repoId);
      return repo ? mapTree(repo.tree) : [];
    },

    async listCommits(repoId) {
      const repo = MOCK_REPOS.find((item) => item.id === repoId);
      return repo?.commits.map((commit) => ({ ...commit })) ?? [];
    },

    async listPulls() {
      return [];
    },

    async getFile(repoId, path): Promise<RepoFileContent> {
      const repo = MOCK_REPOS.find((item) => item.id === repoId);
      if (!repo) {
        throw new Error("repo_not_found");
      }
      const file = findFile(repo.tree, path.split("/").filter(Boolean));
      if (!file || file.kind !== "file") {
        throw new Error("file_not_found");
      }
      const name = file.name;
      if (file.preview === "tooLarge") {
        return {
          path,
          name,
          size: 3_400_000,
          sizeLabel: file.sizeLabel ?? "—",
          kind: "tooLarge",
        };
      }
      if (file.preview === "binary") {
        return {
          path,
          name,
          size: 0,
          sizeLabel: file.sizeLabel ?? "—",
          kind: "binary",
        };
      }
      const content = file.content ?? "";
      return {
        path,
        name,
        size: content.length,
        sizeLabel: file.sizeLabel ?? "—",
        ...(file.linesLabel ? { linesLabel: file.linesLabel } : {}),
        kind: content.length === 0 ? "empty" : "nominal",
        content,
      };
    },
  };
}
