import type { ReactNode } from "react";

import { AppShell } from "@/features/home/components/AppShell";
import { HomeRepoPanel } from "@/features/home/components/HomeRepoPanel";
import { HomeSidePanel } from "@/features/home/components/HomeSidePanel";
import { RepoPanelProvider } from "@/features/home/context";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <RepoPanelProvider>
      <AppShell side={<HomeSidePanel />} repo={<HomeRepoPanel />}>
        {children}
      </AppShell>
    </RepoPanelProvider>
  );
}
