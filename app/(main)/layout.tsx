import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { AppShell } from "@/features/home/components/AppShell";
import { HomeRepoPanel } from "@/features/home/components/HomeRepoPanel";
import { HomeSidePanel } from "@/features/home/components/HomeSidePanel";
import { RepoPanelProvider } from "@/features/home/context";
import { ROUTES } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export default async function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (hasSupabasePublicEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(ROUTES.login);
    }
  }

  return (
    <RepoPanelProvider>
      <AppShell
        side={
          <Suspense fallback={null}>
            <HomeSidePanel />
          </Suspense>
        }
        repo={<HomeRepoPanel />}
      >
        {children}
      </AppShell>
    </RepoPanelProvider>
  );
}
