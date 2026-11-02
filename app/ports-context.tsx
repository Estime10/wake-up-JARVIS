"use client";

import { createContext, use, type ReactNode } from "react";

import type { Ports } from "@/ports";

const PortsContext = createContext<Ports | null>(null);

type PortsProviderProps = {
  value: Ports;
  children: ReactNode;
};

/** Point d'entrée client — expose les ports aux hooks UI. */
export function PortsProvider({ value, children }: PortsProviderProps) {
  return <PortsContext value={value}>{children}</PortsContext>;
}

export function usePorts(): Ports {
  const ports = use(PortsContext);
  if (!ports) {
    throw new Error("usePorts doit être utilisé sous PortsProvider");
  }
  return ports;
}
