"use client";

import { useEffect, useState, type ReactNode } from "react";

import { createAppPorts } from "@/adapters/createAppPorts";
import { PortsProvider } from "@/app/ports-context";
import { AuthProvider } from "@/features/auth";
import { MailFeedProvider } from "@/features/mail/MailFeedProvider";
import { getRuntime } from "@/lib/runtime/getRuntime";

type ProvidersProps = {
  children: ReactNode;
};

/**
 * Seul endroit autorisé à importer `@/adapters/*`.
 * V0b : Memory + Profile + Mail Supabase si env ; Auth email via AuthProvider.
 */
export function Providers({ children }: ProvidersProps) {
  const [ports] = useState(() => createAppPorts());

  useEffect(() => {
    document.documentElement.dataset.runtime = getRuntime();
  }, []);

  return (
    <PortsProvider value={ports}>
      <AuthProvider>
        <MailFeedProvider>{children}</MailFeedProvider>
      </AuthProvider>
    </PortsProvider>
  );
}
