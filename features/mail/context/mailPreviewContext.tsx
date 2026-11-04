"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { MailSummary } from "@/lib/schemas";

type MailPreviewContextValue = {
  selected: MailSummary | null;
  select: (mail: MailSummary) => void;
  clear: () => void;
};

const MailPreviewContext = createContext<MailPreviewContextValue | null>(null);

/**
 * Mail sélectionné pour le 2ᵉ tiroir — tenu hors du tiroir liste
 * (transform) pour que l’aperçu `fixed` se positionne sur le viewport.
 */
export function MailPreviewProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<MailSummary | null>(null);

  const select = useCallback((mail: MailSummary) => {
    setSelected(mail);
  }, []);

  const clear = useCallback(() => {
    setSelected(null);
  }, []);

  const value = useMemo(
    () => ({ selected, select, clear }),
    [selected, select, clear],
  );

  return <MailPreviewContext value={value}>{children}</MailPreviewContext>;
}

export function useMailPreview(): MailPreviewContextValue {
  const ctx = useContext(MailPreviewContext);
  if (!ctx) {
    throw new Error(
      "useMailPreview doit être utilisé sous MailPreviewProvider",
    );
  }
  return ctx;
}
