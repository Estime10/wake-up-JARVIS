import { NextResponse, type NextRequest } from "next/server";

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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const log = createLogger("gmail-oauth.connect");

/** Démarre OAuth Gmail — session JARVIS requise. */
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    pushOAuthDebug("connect.no_session");
    log.warn("no_jarvis_session");
    return NextResponse.redirect(new URL(ROUTES.login, request.url));
  }

  const { count, error } = await supabase
    .from("mail_accounts")
    .select("id", { count: "exact", head: true });

  if (error) {
    pushOAuthDebug("connect.count_fail", error.message);
    log.error("count_failed", { message: error.message });
    return NextResponse.redirect(
      new URL(`${ROUTES.home}?mail_oauth=error`, request.url),
    );
  }

  if ((count ?? 0) >= 3) {
    pushOAuthDebug("connect.limit");
    log.warn("account_limit");
    return NextResponse.redirect(
      new URL(`${ROUTES.home}?mail_oauth=limit`, request.url),
    );
  }

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
