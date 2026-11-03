import { redirect } from "next/navigation";

import { AuthScreen } from "@/features/auth";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export default async function LoginPage() {
  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect(ROUTES.splash);
    }
  }

  return <AuthScreen />;
}
