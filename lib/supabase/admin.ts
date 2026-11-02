import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseUrl } from "@/lib/supabase/env";

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquante");
  }
  return key;
}

/** Client service_role — routes serveur uniquement, jamais au client. */
export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function hasSupabaseServiceRole(): boolean {
  try {
    getSupabaseUrl();
    getServiceRoleKey();
    return true;
  } catch {
    return false;
  }
}
