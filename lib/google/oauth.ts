import "server-only";

import { z } from "zod";

import {
  getGoogleClientId,
  getGoogleClientSecret,
  getGoogleRedirectUri,
} from "@/lib/google/env";
import { GMAIL_OAUTH_SCOPE_STRING } from "@/lib/google/scopes";

const googleErrorBodySchema = z.object({
  error: z.string().optional(),
});

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export type GoogleTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export type GoogleUserInfo = {
  id: string;
  email: string;
  verified_email?: boolean;
};

/** URL d’autorisation — offline + consent pour refresh_token. */
export function buildGoogleAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: GMAIL_OAUTH_SCOPE_STRING,
    access_type: "offline",
    prompt: "consent select_account",
    include_granted_scopes: "false",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: getGoogleRedirectUri(),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let errorCode = "unknown";
    try {
      const parsed = googleErrorBodySchema.safeParse(JSON.parse(raw));
      if (parsed.success && parsed.data.error) {
        errorCode = parsed.data.error;
      }
    } catch {
      /* corps non-JSON — ne pas logger le brut */
    }
    throw new Error(`google_token_exchange_${response.status}:${errorCode}`);
  }

  return (await response.json()) as GoogleTokenResponse;
}

export async function fetchGoogleUserEmail(
  accessToken: string,
): Promise<GoogleUserInfo> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`google_userinfo_${response.status}`);
  }

  const data = (await response.json()) as GoogleUserInfo;
  if (!data.email) {
    throw new Error("google_userinfo_missing_email");
  }
  return data;
}

export async function revokeGoogleToken(token: string): Promise<void> {
  const body = new URLSearchParams({ token });
  const response = await fetch(GOOGLE_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  // 200 = révoqué ; 400 souvent déjà invalide — on n’échoue pas le débranchement local.
  if (!response.ok && response.status !== 400) {
    throw new Error(`google_revoke_${response.status}`);
  }
}
