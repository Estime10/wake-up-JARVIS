import { createHash, randomBytes } from "node:crypto";

export const GOOGLE_OAUTH_STATE_COOKIE = "jarvis_google_oauth_state";

/** State OAuth anti-CSRF (cookie httpOnly). */
export function createOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

export function hashOAuthState(state: string): string {
  return createHash("sha256").update(state).digest("base64url");
}
