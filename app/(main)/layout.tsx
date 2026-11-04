import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { AppShell } from "@/features/home/components/AppShell";
import { HomeMailDrawer } from "@/features/home/components/HomeMailDrawer";
import { HomeRepoPanel } from "@/features/home/components/HomeRepoPanel";
import { HomeSupabaseDrawer } from "@/features/home/components/HomeSupabaseDrawer";
import {
  MailPanelProvider,
  RepoPanelProvider,
  SupabasePanelProvider,
} from "@/features/home/context";
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
      <MailPanelProvider>
        <SupabasePanelProvider>
          <AppShell
            side={null}
            repo={<HomeRepoPanel />}
            mail={<HomeMailDrawer />}
            supabase={<HomeSupabaseDrawer />}
          >
            {children}
          </AppShell>
        </SupabasePanelProvider>
      </MailPanelProvider>
    </RepoPanelProvider>
  );
}
