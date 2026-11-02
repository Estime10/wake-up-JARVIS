"use client";

import { useCallback, useEffect, useState } from "react";

import { ROUTES } from "@/lib/routes";
import { githubConnectionSchema, type GithubConnection } from "@/lib/schemas";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export type GithubConnectionLoadStatus =
  "loading" | "ready" | "error" | "unavailable";

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

/**
 * Connexion GitHub (ADR 0011 étape 1) — status / connect / disconnect.
 * Sans env Supabase : unavailable (panneau mock).
 */
export function useGithubConnection(): UseGithubConnectionResult {
  const [connection, setConnection] = useState<GithubConnection | null>(null);
  const [status, setStatus] = useState<GithubConnectionLoadStatus>(() =>
    SUPABASE_READY ? "loading" : "unavailable",
  );
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => {
    if (!SUPABASE_READY) {
      return;
    }
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!SUPABASE_READY) {
      return;
    }

    let cancelled = false;

    void fetch(ROUTES.githubStatus, { credentials: "same-origin" })
      .then(async (response) => {
        if (cancelled) {
          return;
        }
        if (response.status === 401) {
          setConnection(null);
          setStatus("ready");
          return;
        }
        if (!response.ok) {
          setConnection(null);
          setStatus("error");
          return;
        }
        const json = (await response.json()) as StatusResponse;
        if (!json.ok) {
          setConnection(null);
          setStatus("error");
          return;
        }
        if (!json.connected) {
          setConnection(null);
          setStatus("ready");
          return;
        }
        setConnection(githubConnectionSchema.parse(json.connection));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setConnection(null);
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

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
        setConnection(githubConnectionSchema.parse(json.connection));
        setStatus("ready");
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
      setConnection(null);
      setStatus("ready");
      return true;
    } catch {
      return false;
    }
  }, []);

  return { connection, status, refresh, connect, disconnect };
}
