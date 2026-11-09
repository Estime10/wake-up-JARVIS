import { NextResponse, type NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/updateSession";

/**
 * Proxy Next 16 — CSP à nonce + refresh session Supabase.
 * CSP : seul endroit de la Content-Security-Policy (ADR 0002 / PLAN-UI §6).
 *
 * `upgrade-insecure-requests` uniquement en HTTPS. Sur http://localhost (tauri:dev),
 * WKWebView sinon force https → CSS/JS morts → UI blanche + mark déformé.
 */
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const isHttps = request.nextUrl.protocol === "https:";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    isDev
      ? "style-src 'self' 'unsafe-inline'"
      : `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    // Supabase : Auth + Data API. Dev : HMR Turbopack (ws) pour le shell Tauri.
    isDev
      ? "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws://127.0.0.1:* ws://localhost:* http://127.0.0.1:* http://localhost:*"
      : "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    // Studio embed (:54332) + navigateur libre (placeholder iframe) — dev only (DEV-12 / Tauri).
    isDev
      ? "frame-src 'self' http://127.0.0.1:54332 https: http:"
      : "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isHttps ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  return updateSupabaseSession(request, response, requestHeaders);
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
