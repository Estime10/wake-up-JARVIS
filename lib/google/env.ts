import "server-only";

/** Env Google OAuth — serveur uniquement. */

export function getGoogleClientId(): string {
  const value = process.env.GOOGLE_CLIENT_ID;
  if (!value) {
    throw new Error("GOOGLE_CLIENT_ID manquante");
  }
  return value;
}

export function getGoogleClientSecret(): string {
  const value = process.env.GOOGLE_CLIENT_SECRET;
  if (!value) {
    throw new Error("GOOGLE_CLIENT_SECRET manquante");
  }
  return value;
}

export function getGoogleRedirectUri(): string {
  const value = process.env.GOOGLE_REDIRECT_URI;
  if (!value) {
    throw new Error("GOOGLE_REDIRECT_URI manquante");
  }
  return value;
}

export function hasGoogleOAuthEnv(): boolean {
  try {
    getGoogleClientId();
    getGoogleClientSecret();
    getGoogleRedirectUri();
    return true;
  } catch {
    return false;
  }
}
