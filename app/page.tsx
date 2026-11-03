import { redirect } from "next/navigation";

import { SplashEntry } from "@/features/intro/SplashEntry";
import { ROUTES } from "@/lib/routes";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Entrée `/` — auth d’abord, puis splash (évite de casser l’intro).
 */
export default async function Home() {
  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(ROUTES.login);
    }
  }

  return <SplashEntry />;
}
