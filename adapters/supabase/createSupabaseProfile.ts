import type { SupabaseClient } from "@supabase/supabase-js";

import { userProfileSchema, type UserProfile } from "@/lib/schemas";
import type { ProfilePort } from "@/ports/profile-port";

type ProfileRow = {
  id: string;
  display_name: string | null;
  username: string | null;
};

/**
 * ProfilePort → table `public.profiles` (RLS par id = auth.uid()).
 * Sans session : null (le hook garde le fallback i18n).
 */
export function createSupabaseProfile(client: SupabaseClient): ProfilePort {
  return {
    async getProfile(): Promise<UserProfile | null> {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await client
        .from("profiles")
        .select("id, display_name, username")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        throw new Error(`ProfilePort.getProfile: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      const row = data as ProfileRow;
      return userProfileSchema.parse({
        id: row.id,
        displayName: row.display_name,
        username: row.username,
      });
    },
  };
}
