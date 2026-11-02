/**
 * Cookies Auth minimaux — évite HTTP 431 (headers trop gros).
 * Même valeur sur client + serveur + proxy.
 */
export const SUPABASE_COOKIE_ENCODE = "tokens-only" as const;
