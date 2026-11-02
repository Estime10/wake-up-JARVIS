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
} as const;
