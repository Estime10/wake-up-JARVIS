import "server-only";

import { getGoogleClientId, getGoogleClientSecret } from "@/lib/google/env";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GoogleAccessTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: "invalid_grant" | "error"; message: string };

/** Échange refresh_token → access_token (jamais loggé). */
export async function refreshGoogleAccessToken(
  refreshToken: string,
): Promise<GoogleAccessTokenResult> {
  const body = new URLSearchParams({
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 400 && text.includes("invalid_grant")) {
      return { ok: false, reason: "invalid_grant", message: "invalid_grant" };
    }
    return {
      ok: false,
      reason: "error",
      message: `refresh_${response.status}`,
    };
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    return { ok: false, reason: "error", message: "missing_access_token" };
  }
  return { ok: true, accessToken: data.access_token };
}
