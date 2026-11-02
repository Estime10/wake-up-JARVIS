/** Routes applicatives — seule source des chemins (pas de littéraux épars). */
export const ROUTES = {
  splash: "/",
  login: "/login",
  home: "/home",
  signOut: "/auth/signout",
  googleOAuthConnect: "/api/google/oauth/connect",
  googleOAuthCallback: "/api/google/oauth/callback",
} as const;
