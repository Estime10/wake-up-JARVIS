import { redirect } from "next/navigation";
import { type ReactNode } from "react";

import { AppShell } from "@/features/home/components/layout/AppShell";
import { MailPanelProvider } from "@/features/home/context/mailPanelContext";
import { RepoPanelProvider } from "@/features/home/context/repoPanelContext";
import { TerminalSessionProvider } from "@/features/home/context/terminalSessionContext";
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
        <TerminalSessionProvider>
          <AppShell>{children}</AppShell>
        </TerminalSessionProvider>
      </MailPanelProvider>
    </RepoPanelProvider>
  );
}
