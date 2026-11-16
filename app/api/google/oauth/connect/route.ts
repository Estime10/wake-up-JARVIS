import { NextResponse, type NextRequest } from "next/server";

import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { buildGoogleAuthorizeUrl } from "@/lib/google/oauth";
import { pushOAuthDebug } from "@/lib/google/oauthDebugRing";
import { hasGoogleOAuthEnv } from "@/lib/google/env";
import {
  createOAuthState,
  GOOGLE_OAUTH_STATE_COOKIE,
  hashOAuthState,
} from "@/lib/google/oauthState";
import { createLogger } from "@/lib/logger";
import { ROUTES } from "@/lib/routes";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const log = createLogger("gmail-oauth.connect");

/** Démarre OAuth Gmail — propriétaire (OWNER_EMAILS) requis. */
export async function GET(request: NextRequest) {
  pushOAuthDebug("connect.hit");
  log.info("hit");

  if (
    !hasSupabasePublicEnv() ||
    !hasGoogleOAuthEnv() ||
    !hasSupabaseServiceRole()
  ) {
    pushOAuthDebug("connect.config_missing");
    log.error("config_missing");
    return NextResponse.redirect(
      new URL(`${ROUTES.home}?mail_oauth=config`, request.url),
    );
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    if (access.status === 401) {
      pushOAuthDebug("connect.no_session");
      log.warn("no_jarvis_session");
      return NextResponse.redirect(new URL(ROUTES.login, request.url));
    }
    pushOAuthDebug("connect.forbidden", access.error);
    log.warn("forbidden", { error: access.error });
    return NextResponse.redirect(
      new URL(`${ROUTES.home}?mail_oauth=forbidden`, request.url),
    );
  }

  // Pas de garde count ici : une boîte `needs_reauth` doit pouvoir
  // repasser OAuth même à 3 comptes. La limite « 4ᵉ boîte » est
  // appliquée dans `admin_mail_account_store_token` (upsert).

  const state = createOAuthState();
  const authorizeUrl = buildGoogleAuthorizeUrl(state);
  pushOAuthDebug("connect.redirect_google");
  log.info("redirect_google");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, hashOAuthState(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return response;
}
