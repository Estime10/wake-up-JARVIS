/** Routes applicatives — seule source des chemins (pas de littéraux épars). */
export const ROUTES = {
  /** `@deprecated` alias `/` — redirige vers home (splash = overlay). */
  splash: "/",
  login: "/login",
  home: "/home",
  credits: "/credits",
  signOut: "/auth/signout",
  googleOAuthConnect: "/api/google/oauth/connect",
  googleOAuthCallback: "/api/google/oauth/callback",
  assistantReply: "/api/assistant/reply",
  voicePiper: "/api/voice/piper",
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
  supabasePlatformConnect: "/api/supabase/platform/connect",
  supabasePlatformStatus: "/api/supabase/platform/status",
  supabasePlatformDisconnect: "/api/supabase/platform/disconnect",
  supabasePlatformProjects: "/api/supabase/platform/projects",
  supabasePlatformSelectProject: "/api/supabase/platform/select-project",
  supabasePlatformSetActive: "/api/supabase/platform/set-active",
  supabasePlatformDockerEnsure: "/api/supabase/platform/docker/ensure",
  supabasePlatformStudioStart: "/api/supabase/platform/studio/start",
  supabasePlatformStudioStop: "/api/supabase/platform/studio/stop",
} as const;
