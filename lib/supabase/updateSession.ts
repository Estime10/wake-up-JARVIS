import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  hasSupabasePublicEnv,
} from "@/lib/supabase/env";

/**
 * Rafraîchit la session Auth sur la réponse déjà construite (CSP/nonce).
 * Pas de redirect login ici — l'app reste utilisable en mock sans session.
 */
export async function updateSupabaseSession(
  request: NextRequest,
  response: NextResponse,
  requestHeaders: Headers,
): Promise<NextResponse> {
  if (!hasSupabasePublicEnv()) {
    return response;
  }

  let supabaseResponse = response;

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          // Reprendre les en-têtes déjà posés (CSP, etc.).
          response.headers.forEach((value, key) => {
            supabaseResponse.headers.set(key, value);
          });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
          for (const [key, value] of Object.entries(headers)) {
            supabaseResponse.headers.set(key, value);
          }
        },
      },
    },
  );

  // Obligatoire avant tout autre appel auth (docs SSR).
  await supabase.auth.getClaims();

  return supabaseResponse;
}
