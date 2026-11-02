/** Scopes Gmail — ADR 0010 : readonly uniquement (+ openid/email identité). */
export const GMAIL_OAUTH_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/gmail.readonly",
] as const;

export const GMAIL_OAUTH_SCOPE_STRING = GMAIL_OAUTH_SCOPES.join(" ");
