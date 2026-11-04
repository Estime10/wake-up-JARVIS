import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/routes";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * `/` — plus de page splash séparée : auth → `/home` (splash en overlay).
 */
export default async function RootPage() {
  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(ROUTES.login);
    }
  }

  redirect(ROUTES.home);
}
