"use client";

import { useState, type ReactNode } from "react";

import { createMockPorts } from "@/adapters/mock";
import { PortsProvider } from "@/app/ports-context";

type ProvidersProps = {
  children: ReactNode;
};

/**
 * Seul endroit autorisé à importer `@/adapters/*`.
 * Plus tard : brancher les vrais adapters ici sans toucher l'UI.
 */
export function Providers({ children }: ProvidersProps) {
  const [ports] = useState(() => createMockPorts());

  return <PortsProvider value={ports}>{children}</PortsProvider>;
}
