import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { SUPABASE_COOKIE_ENCODE } from "@/lib/supabase/cookieOptions";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

/** Client serveur — Server Components, Route Handlers, Server Actions. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      encode: SUPABASE_COOKIE_ENCODE,
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component : l'écriture cookies est gérée par proxy.ts.
        }
      },
    },
  });
}
