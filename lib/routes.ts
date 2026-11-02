/** Routes applicatives — seule source des chemins (pas de littéraux épars). */
export const ROUTES = {
  splash: "/",
  login: "/login",
  home: "/home",
  signOut: "/auth/signout",
  googleOAuthConnect: "/api/google/oauth/connect",
  googleOAuthCallback: "/api/google/oauth/callback",
  githubConnect: "/api/github/connect",
  githubStatus: "/api/github/status",
  githubDisconnect: "/api/github/disconnect",
  githubRepos: "/api/github/repos",
  githubRepoTree: (owner: string, repo: string) =>
    `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tree`,
  githubRepoCommits: (owner: string, repo: string) =>
    `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`,
  githubRepoBranches: (owner: string, repo: string) =>
    `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches`,
  githubRepoPulls: (owner: string, repo: string) =>
    `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`,
  githubRepoContents: (owner: string, repo: string) =>
    `/api/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents`,
} as const;
