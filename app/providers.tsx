"use client";

import { useState, type ReactNode } from "react";

import { createAppPorts } from "@/adapters/createAppPorts";
import { PortsProvider } from "@/app/ports-context";
import { AuthProvider } from "@/features/auth";

type ProvidersProps = {
  children: ReactNode;
};

/**
 * Seul endroit autorisé à importer `@/adapters/*`.
 * V0b : Memory + Profile Supabase si env ; Auth email via AuthProvider.
 */
export function Providers({ children }: ProvidersProps) {
  const [ports] = useState(() => createAppPorts());

  return (
    <PortsProvider value={ports}>
      <AuthProvider>{children}</AuthProvider>
    </PortsProvider>
  );
}
