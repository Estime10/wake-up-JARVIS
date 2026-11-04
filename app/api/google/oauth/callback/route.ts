import { NextResponse, type NextRequest } from "next/server";

import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { exchangeGoogleCode, fetchGoogleUserEmail } from "@/lib/google/oauth";
import { pushOAuthDebug } from "@/lib/google/oauthDebugRing";
import { hasGoogleOAuthEnv } from "@/lib/google/env";
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  hashOAuthState,
} from "@/lib/google/oauthState";
import { mailboxShortLabel } from "@/features/mail/model/mailboxShortLabel";
import { createLogger } from "@/lib/logger";
import { ROUTES } from "@/lib/routes";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const log = createLogger("gmail-oauth.callback");

function homeRedirect(request: NextRequest, result: string): NextResponse {
  pushOAuthDebug("callback.redirect", result);
  log.info("redirect_home", { result });
  const response = NextResponse.redirect(
    new URL(`${ROUTES.home}?mail_oauth=${result}`, request.url),
  );
  response.cookies.set(GOOGLE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return response;
}

function hasGmailReadonlyScope(scope: string | undefined): boolean {
  if (!scope) {
    return false;
  }
  return scope
    .split(/\s+/)
    .includes("https://www.googleapis.com/auth/gmail.readonly");
}

/** Callback Google — stocke refresh token dans Vault via RPC admin. */
export async function GET(request: NextRequest) {
  pushOAuthDebug("callback.hit");
  log.info("hit");

  if (!hasGoogleOAuthEnv()) {
    log.error("missing_env");
    return homeRedirect(request, "config");
  }

  const url = request.nextUrl;
  const errorParam = url.searchParams.get("error");
  if (errorParam) {
    pushOAuthDebug("callback.google_error", errorParam);
    log.warn("google_denied", { error: errorParam });
    return homeRedirect(request, "denied");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedHash = request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (
    !code ||
    !state ||
    !expectedHash ||
    hashOAuthState(state) !== expectedHash
  ) {
    const detail = [
      code ? "code" : "no_code",
      state ? "state" : "no_state",
      expectedHash ? "cookie" : "no_cookie",
    ].join(",");
    pushOAuthDebug("callback.state_fail", detail);
    log.error("state_mismatch", { detail });
    return homeRedirect(request, "state");
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    if (access.status === 401) {
      pushOAuthDebug("callback.no_session");
      log.warn("no_jarvis_session");
      return NextResponse.redirect(new URL(ROUTES.login, request.url));
    }
    pushOAuthDebug("callback.forbidden", access.error);
    log.warn("forbidden", { error: access.error });
    return homeRedirect(request, "forbidden");
  }

  try {
    pushOAuthDebug("callback.exchange_start");
    const tokens = await exchangeGoogleCode(code);
    pushOAuthDebug(
      "callback.exchange_ok",
      tokens.refresh_token ? "refresh" : "no_refresh",
    );

    if (!tokens.refresh_token) {
      log.error("no_refresh_token");
      return homeRedirect(request, "no_refresh");
    }

    if (!hasGmailReadonlyScope(tokens.scope)) {
      pushOAuthDebug("callback.scope_fail", tokens.scope);
      log.error("gmail_readonly_missing", { scope: tokens.scope });
      return homeRedirect(request, "scope");
    }

    const profile = await fetchGoogleUserEmail(tokens.access_token);
    pushOAuthDebug("callback.userinfo_ok");
    const label = mailboxShortLabel(profile.email);
    const admin = createSupabaseAdminClient();

    const { error } = await admin.rpc("admin_mail_account_store_token", {
      p_user_id: access.user.id,
      p_email: profile.email,
      p_label: label,
      p_refresh_token: tokens.refresh_token,
    });

    if (error) {
      pushOAuthDebug("callback.store_fail", error.message);
      log.error("store_rpc_failed", { message: error.message });
      if (error.message.includes("mail_account_limit")) {
        return homeRedirect(request, "limit");
      }
      return homeRedirect(request, "store");
    }

    pushOAuthDebug("callback.ok");
    return homeRedirect(request, "ok");
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    pushOAuthDebug("callback.exception", message);
    log.error("callback_failed", { message });
    return homeRedirect(request, "error");
  }
}
