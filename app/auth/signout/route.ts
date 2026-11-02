import { NextResponse, type NextRequest } from "next/server";

import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

/** Expire tous les cookies `sb-*` (chunks inclus) — recovery HTTP 431. */
function clearSupabaseCookies(
  request: NextRequest,
  response: NextResponse,
): void {
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.startsWith("sb-")) {
      continue;
    }
    response.cookies.set(cookie.name, "", {
      path: "/",
      maxAge: 0,
    });
  }
}

/** Déconnexion — clear cookies session puis /login. */
export async function GET(request: NextRequest) {
  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL(ROUTES.login, request.url));
  clearSupabaseCookies(request, response);
  return response;
}
