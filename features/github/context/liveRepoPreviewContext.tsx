"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { RepoFilePreviewModel } from "@/features/home/components/repo/RepoFilePreview";

type LiveRepoPreviewValue = {
  preview: RepoFilePreviewModel | null;
  setPreview: (model: RepoFilePreviewModel | null) => void;
  closePreview: () => void;
  retryPreview: () => void;
  registerRetry: (fn: (() => void) | null) => void;
};

const LiveRepoPreviewContext = createContext<LiveRepoPreviewValue | null>(null);

/**
 * Aperçu fichier live — tenu hors du tiroir fichiers (transform)
 * pour que le 2ᵉ tiroir `fixed` se positionne sur le viewport.
 */
export function LiveRepoPreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreview] = useState<RepoFilePreviewModel | null>(null);
  const retryRef = useRef<(() => void) | null>(null);

  const closePreview = useCallback(() => {
    setPreview(null);
    retryRef.current = null;
  }, []);

  const registerRetry = useCallback((fn: (() => void) | null) => {
    retryRef.current = fn;
  }, []);

  const retryPreview = useCallback(() => {
    retryRef.current?.();
  }, []);

  const value = useMemo(
    () => ({
      preview,
      setPreview,
      closePreview,
      retryPreview,
      registerRetry,
    }),
    [preview, closePreview, retryPreview, registerRetry],
  );

  return (
    <LiveRepoPreviewContext value={value}>{children}</LiveRepoPreviewContext>
  );
}

export function useLiveRepoPreview(): LiveRepoPreviewValue {
  const ctx = useContext(LiveRepoPreviewContext);
  if (!ctx) {
    throw new Error(
      "useLiveRepoPreview doit être utilisé sous LiveRepoPreviewProvider",
    );
  }
  return ctx;
}
