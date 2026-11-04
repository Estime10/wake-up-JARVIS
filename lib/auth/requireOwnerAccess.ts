import "server-only";

import { type User } from "@supabase/supabase-js";

import {
  evaluateOwnerAccess,
  type OwnerAccessDenied,
} from "@/lib/auth/evaluateOwnerAccess";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RequireOwnerAccessResult =
  { ok: true; user: User } | OwnerAccessDenied;

/**
 * Auth session + allowlist OWNER_EMAILS.
 * Identité via getUser() (jamais getSession()). Pas de MFA.
 */
export async function requireOwnerAccess(): Promise<RequireOwnerAccessResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const evaluated = evaluateOwnerAccess({
    user: user ? { id: user.id, email: user.email ?? null } : null,
  });

  if (!evaluated.ok) {
    return evaluated;
  }

  if (!user) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  return { ok: true, user };
}
