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

import type { RepoCommitPreviewModel } from "@/features/home/components/repo/RepoCommitPreview";
import type { RepoFilePreviewModel } from "@/features/home/components/repo/RepoFilePreview";

type LiveRepoPreviewValue = {
  preview: RepoFilePreviewModel | null;
  commitPreview: RepoCommitPreviewModel | null;
  setPreview: (model: RepoFilePreviewModel | null) => void;
  setCommitPreview: (model: RepoCommitPreviewModel | null) => void;
  closePreview: () => void;
  retryPreview: () => void;
  registerRetry: (fn: (() => void) | null) => void;
};

const LiveRepoPreviewContext = createContext<LiveRepoPreviewValue | null>(null);

/**
 * Aperçu fichier / commit — tenu hors du tiroir fichiers (transform)
 * pour que le 2ᵉ tiroir `fixed` se positionne sur le viewport.
 */
export function LiveRepoPreviewProvider({ children }: { children: ReactNode }) {
  const [preview, setPreviewState] = useState<RepoFilePreviewModel | null>(
    null,
  );
  const [commitPreview, setCommitPreviewState] =
    useState<RepoCommitPreviewModel | null>(null);
  const retryRef = useRef<(() => void) | null>(null);

  const setPreview = useCallback((model: RepoFilePreviewModel | null) => {
    setCommitPreviewState(null);
    setPreviewState(model);
  }, []);

  const setCommitPreview = useCallback(
    (model: RepoCommitPreviewModel | null) => {
      setPreviewState(null);
      retryRef.current = null;
      setCommitPreviewState(model);
    },
    [],
  );

  const closePreview = useCallback(() => {
    setPreviewState(null);
    setCommitPreviewState(null);
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
      commitPreview,
      setPreview,
      setCommitPreview,
      closePreview,
      retryPreview,
      registerRetry,
    }),
    [
      preview,
      commitPreview,
      setPreview,
      setCommitPreview,
      closePreview,
      retryPreview,
      registerRetry,
    ],
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
