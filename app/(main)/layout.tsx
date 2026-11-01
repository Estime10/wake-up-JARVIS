import type { ReactNode } from "react";

import { AppShell } from "@/features/home/components/AppShell";
import { HomeSidePanel } from "@/features/home/components/HomeSidePanel";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <AppShell side={<HomeSidePanel />}>{children}</AppShell>;
}
