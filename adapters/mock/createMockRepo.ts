import type { RepoPort } from "@/ports/repo-port";

/**
 * Adapter mock minimal — pas de fixtures tree/commits (données = API live).
 * Sert uniquement quand Supabase n’est pas configuré.
 */
export function createMockRepo(): RepoPort {
  return {
    async listRepos() {
      return [];
    },

    async listBranches() {
      return [];
    },

    async listTree() {
      return [];
    },

    async listCommits() {
      return [];
    },

    async listPulls() {
      return [];
    },

    async getFile() {
      throw new Error("file_not_found");
    },
  };
}
