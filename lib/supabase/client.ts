import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_COOKIE_ENCODE } from "@/lib/supabase/cookieOptions";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

/** Client navigateur (singleton interne @supabase/ssr). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      encode: SUPABASE_COOKIE_ENCODE,
    },
  });
}
