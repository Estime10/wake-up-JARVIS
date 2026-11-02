import { t } from "@/lib/i18n";
import { userProfileSchema } from "@/lib/schemas";
import type { ProfilePort } from "@/ports/profile-port";

/** Profil mock — même fallback i18n que le salut hors Supabase. */
export function createMockProfile(): ProfilePort {
  return {
    async getProfile() {
      const name = t("user.displayName");
      return userProfileSchema.parse({
        id: "mock-user",
        displayName: name,
        username: name,
      });
    },
  };
}
