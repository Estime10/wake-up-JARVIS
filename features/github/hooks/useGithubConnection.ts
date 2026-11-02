"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import type { GithubConnectionLoadStatus } from "@/features/github/model/githubConnectionStatus";
import {
  bumpGithubConnectionAttempt,
  getGithubConnectionSnapshot,
  initGithubConnectionStore,
  setGithubConnectionSnapshot,
  subscribeGithubConnection,
} from "@/features/github/model/githubConnectionStore";
import { clearLiveRepoSessionCache } from "@/features/github/model/liveRepoSessionCache";
import { ROUTES } from "@/lib/routes";
import { githubConnectionSchema, type GithubConnection } from "@/lib/schemas";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export type { GithubConnectionLoadStatus };

type UseGithubConnectionResult = {
  connection: GithubConnection | null;
  status: GithubConnectionLoadStatus;
  refresh: () => void;
  connect: (input: {
    token: string;
    expiresAt?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  disconnect: () => Promise<boolean>;
};

const SUPABASE_READY = hasSupabasePublicEnv();

type StatusResponse =
  | { ok: true; connected: false }
  | { ok: true; connected: true; connection: unknown }
  | { ok: false };

let bootstrapped = false;
/** Dernier `attempt` pour lequel le status a été résolu (module = partagé). */
let resolvedAttempt = -1;
let inFlight: Promise<void> | null = null;

function ensureStoreBootstrapped(): void {
  if (bootstrapped) {
    return;
  }
  bootstrapped = true;
  initGithubConnectionStore(SUPABASE_READY ? "loading" : "unavailable");
}

async function loadGithubStatus(): Promise<void> {
  try {
    const response = await fetch(ROUTES.githubStatus, {
      credentials: "same-origin",
    });
    if (response.status === 401) {
      setGithubConnectionSnapshot({ connection: null, status: "ready" });
      return;
    }
    if (!response.ok) {
      setGithubConnectionSnapshot({ connection: null, status: "error" });
      return;
    }
    const json = (await response.json()) as StatusResponse;
    if (!json.ok) {
      setGithubConnectionSnapshot({ connection: null, status: "error" });
      return;
    }
    if (!json.connected) {
      setGithubConnectionSnapshot({ connection: null, status: "ready" });
      return;
    }
    setGithubConnectionSnapshot({
      connection: githubConnectionSchema.parse(json.connection),
      status: "ready",
    });
  } catch {
    setGithubConnectionSnapshot({ connection: null, status: "error" });
  }
}

/**
 * Connexion GitHub (ADR 0011 étape 1) — status / connect / disconnect.
 * Store partagé : un seul fetch SPA, pas de flash loading à chaque ouverture du tiroir.
 * Sans env Supabase : unavailable (panneau mock).
 */
export function useGithubConnection(): UseGithubConnectionResult {
  ensureStoreBootstrapped();

  const snapshot = useSyncExternalStore(
    subscribeGithubConnection,
    getGithubConnectionSnapshot,
    getGithubConnectionSnapshot,
  );

  const refresh = useCallback(() => {
    if (!SUPABASE_READY) {
      return;
    }
    bumpGithubConnectionAttempt();
  }, []);

  useEffect(() => {
    if (!SUPABASE_READY) {
      return;
    }

    const attempt = snapshot.attempt;
    if (resolvedAttempt === attempt) {
      return;
    }

    if (!inFlight) {
      inFlight = loadGithubStatus().finally(() => {
        resolvedAttempt = attempt;
        inFlight = null;
      });
    }
  }, [snapshot.attempt]);

  const connect = useCallback(
    async (input: { token: string; expiresAt?: string }) => {
      try {
        const response = await fetch(ROUTES.githubConnect, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: input.token,
            ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
          }),
        });
        const json = (await response.json()) as {
          ok: boolean;
          error?: string;
          connection?: unknown;
        };
        if (!response.ok || !json.ok || !json.connection) {
          return {
            ok: false as const,
            error: json.error ?? "upstream",
          };
        }
        clearLiveRepoSessionCache();
        setGithubConnectionSnapshot({
          connection: githubConnectionSchema.parse(json.connection),
          status: "ready",
        });
        resolvedAttempt = getGithubConnectionSnapshot().attempt;
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: "network" };
      }
    },
    [],
  );

  const disconnect = useCallback(async () => {
    try {
      const response = await fetch(ROUTES.githubDisconnect, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
        return false;
      }
      clearLiveRepoSessionCache();
      setGithubConnectionSnapshot({ connection: null, status: "ready" });
      resolvedAttempt = getGithubConnectionSnapshot().attempt;
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    connection: snapshot.connection,
    status: snapshot.status,
    refresh,
    connect,
    disconnect,
  };
}
