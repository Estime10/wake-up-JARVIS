"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useSupabasePlatform,
  type UseSupabasePlatformResult,
} from "@/features/supabase/hooks/useSupabasePlatform";

type SupabasePlatformContextValue = UseSupabasePlatformResult & {
  connectOpen: boolean;
  openConnect: () => void;
  closeConnect: () => void;
};

const SupabasePlatformContext =
  createContext<SupabasePlatformContextValue | null>(null);

/** Platform + modal connect — partagé header home ↔ colonne droite. */
export function SupabasePlatformProvider({
  children,
}: {
  children: ReactNode;
}) {
  const platform = useSupabasePlatform();
  const [connectOpen, setConnectOpen] = useState(false);

  const openConnect = useCallback(() => {
    setConnectOpen(true);
  }, []);

  const closeConnect = useCallback(() => {
    setConnectOpen(false);
  }, []);

  const value = useMemo<SupabasePlatformContextValue>(
    () => ({
      ...platform,
      connectOpen,
      openConnect,
      closeConnect,
    }),
    [platform, connectOpen, openConnect, closeConnect],
  );

  return (
    <SupabasePlatformContext value={value}>{children}</SupabasePlatformContext>
  );
}

export function useSupabasePlatformContext(): SupabasePlatformContextValue {
  const ctx = useContext(SupabasePlatformContext);
  if (!ctx) {
    throw new Error(
      "useSupabasePlatformContext doit être utilisé sous SupabasePlatformProvider",
    );
  }
  return ctx;
}
