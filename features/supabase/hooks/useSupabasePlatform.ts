"use client";

import { useCallback, useEffect, useState } from "react";

import { ensureLocalStudioViaTauri } from "@/features/home/tauri/studioEnsure";
import { ROUTES } from "@/lib/routes";
import { isTauri } from "@/lib/runtime/isTauri";
import {
  supabasePlatformConnectionSchema,
  supabasePlatformProjectSchema,
  type SupabasePlatformConnection,
  type SupabasePlatformProjectSummary,
} from "@/lib/schemas";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export type SupabasePlatformStatus =
  "loading" | "ready" | "error" | "unavailable";

export type UseSupabasePlatformResult = {
  status: SupabasePlatformStatus;
  connections: SupabasePlatformConnection[];
  /** Compte actif (session). */
  connection: SupabasePlatformConnection | null;
  projects: SupabasePlatformProjectSummary[];
  projectsLoading: boolean;
  /** Docker en cours de vérif / démarrage (clic projet). */
  dockerEnsuring: boolean;
  dockerError: string | null;
  studioStarting: boolean;
  studioError: string | null;
  /** URL iframe (proxy embed :54332) — Studio dans le tiroir. */
  studioUrl: string | null;
  refresh: () => void;
  connect: (input: {
    token: string;
    accountLabel: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  disconnect: (connectionId: string) => Promise<boolean>;
  setActiveAccount: (connectionId: string) => Promise<boolean>;
  selectProject: (project: SupabasePlatformProjectSummary) => Promise<boolean>;
  startStudio: () => Promise<{ ok: true; studioUrl: string } | { ok: false }>;
  /** Quitte la vue Studio → revient aux projets. */
  clearStudio: () => void;
  /** Pose l’URL embed après lancement via intent assistant. */
  adoptStudioUrl: (embedUrl: string) => void;
};

const SUPABASE_READY = hasSupabasePublicEnv();

/**
 * Multi-comptes platform Supabase — 1 token Vault / compte, projets, Studio.
 */
export function useSupabasePlatform(): UseSupabasePlatformResult {
  const [status, setStatus] = useState<SupabasePlatformStatus>(
    SUPABASE_READY ? "loading" : "unavailable",
  );
  const [connections, setConnections] = useState<SupabasePlatformConnection[]>(
    [],
  );
  const [projects, setProjects] = useState<SupabasePlatformProjectSummary[]>(
    [],
  );
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [dockerEnsuring, setDockerEnsuring] = useState(false);
  const [dockerError, setDockerError] = useState<string | null>(null);
  const [studioStarting, setStudioStarting] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [studioUrl, setStudioUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const connection = connections.find((item) => item.isActive) ?? null;

  const refresh = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const loadProjects = useCallback(async (connectionId: string) => {
    setProjectsLoading(true);
    try {
      const url = new URL(
        ROUTES.supabasePlatformProjects,
        window.location.origin,
      );
      url.searchParams.set("connectionId", connectionId);
      const response = await fetch(url.toString(), {
        credentials: "same-origin",
      });
      if (!response.ok) {
        setProjects([]);
        return;
      }
      const json = (await response.json()) as {
        ok: boolean;
        projects?: unknown[];
      };
      if (!json.ok || !json.projects) {
        setProjects([]);
        return;
      }
      setProjects(
        json.projects.map((item) => supabasePlatformProjectSchema.parse(item)),
      );
    } catch {
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!SUPABASE_READY) {
      return;
    }

    let cancelled = false;
    void (async () => {
      setStatus("loading");
      try {
        const response = await fetch(ROUTES.supabasePlatformStatus, {
          credentials: "same-origin",
        });
        if (cancelled) {
          return;
        }
        if (response.status === 401) {
          setConnections([]);
          setProjects([]);
          setStatus("ready");
          return;
        }
        if (!response.ok) {
          setStatus("error");
          return;
        }
        const json = (await response.json()) as {
          ok: boolean;
          connections?: unknown[];
        };
        if (!json.ok) {
          setStatus("error");
          return;
        }
        const list = (json.connections ?? []).map((item) =>
          supabasePlatformConnectionSchema.parse(item),
        );
        setConnections(list);
        setStatus("ready");

        const active = list.find((item) => item.isActive);
        if (active) {
          await loadProjects(active.id);
        } else {
          setProjects([]);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt, loadProjects]);

  const connect = useCallback(
    async (input: { token: string; accountLabel: string }) => {
      try {
        const response = await fetch(ROUTES.supabasePlatformConnect, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const json = (await response.json()) as {
          ok: boolean;
          error?: string;
          connection?: unknown;
          projects?: unknown[];
        };
        if (!response.ok || !json.ok || !json.connection) {
          return { ok: false as const, error: json.error ?? "upstream" };
        }
        const created = supabasePlatformConnectionSchema.parse(json.connection);
        setConnections((prev) => {
          const cleared = created.isActive
            ? prev.map((item) => ({ ...item, isActive: false }))
            : prev;
          return [...cleared, created];
        });
        if (json.projects && created.isActive) {
          setProjects(
            json.projects.map((item) =>
              supabasePlatformProjectSchema.parse(item),
            ),
          );
        }
        setStatus("ready");
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: "network" };
      }
    },
    [],
  );

  const disconnect = useCallback(async (connectionId: string) => {
    try {
      const response = await fetch(ROUTES.supabasePlatformDisconnect, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });
      if (!response.ok) {
        return false;
      }
      setConnections((prev) => prev.filter((item) => item.id !== connectionId));
      setProjects([]);
      setStudioError(null);
      setStudioUrl(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const setActiveAccount = useCallback(
    async (connectionId: string) => {
      try {
        const response = await fetch(ROUTES.supabasePlatformSetActive, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId }),
        });
        const json = (await response.json()) as {
          ok: boolean;
          connection?: unknown;
        };
        if (!response.ok || !json.ok || !json.connection) {
          return false;
        }
        const active = supabasePlatformConnectionSchema.parse(json.connection);
        setConnections((prev) =>
          prev.map((item) =>
            item.id === active.id ? active : { ...item, isActive: false },
          ),
        );
        await loadProjects(active.id);
        return true;
      } catch {
        return false;
      }
    },
    [loadProjects],
  );

  const selectProject = useCallback(
    async (project: SupabasePlatformProjectSummary) => {
      if (!connection) {
        return false;
      }
      setDockerError(null);
      try {
        const response = await fetch(ROUTES.supabasePlatformSelectProject, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectionId: connection.id,
            projectRef: project.ref,
            projectName: project.name,
          }),
        });
        const json = (await response.json()) as {
          ok: boolean;
          connection?: unknown;
        };
        if (!response.ok || !json.ok || !json.connection) {
          return false;
        }
        const updated = supabasePlatformConnectionSchema.parse(json.connection);
        setConnections((prev) =>
          prev.map((item) =>
            item.id === updated.id ? updated : { ...item, isActive: false },
          ),
        );

        // Docker via API Next = dev web only. En shell Tauri, Studio probe loopback.
        if (!isTauri()) {
          setDockerEnsuring(true);
          try {
            const dockerResponse = await fetch(
              ROUTES.supabasePlatformDockerEnsure,
              {
                method: "POST",
                credentials: "same-origin",
              },
            );
            const dockerJson = (await dockerResponse.json()) as {
              ok: boolean;
              error?: string;
            };
            if (!dockerResponse.ok || !dockerJson.ok) {
              setDockerError(dockerJson.error ?? "docker_start_failed");
              return false;
            }
          } finally {
            setDockerEnsuring(false);
          }
        }

        return true;
      } catch {
        setDockerEnsuring(false);
        return false;
      }
    },
    [connection],
  );

  const startStudio = useCallback(async () => {
    setStudioStarting(true);
    setStudioError(null);
    try {
      if (isTauri()) {
        try {
          const ensured = await ensureLocalStudioViaTauri();
          setStudioUrl(ensured.studioUrl);
          return { ok: true as const, studioUrl: ensured.studioUrl };
        } catch (error) {
          const message =
            typeof error === "string"
              ? error
              : error instanceof Error
                ? error.message
                : "not_running";
          const known = [
            "not_running",
            "docker_missing",
            "docker_start_failed",
            "supabase_start_failed",
            "port_in_use",
            "repo_missing",
          ] as const;
          const code = known.find((k) => message.includes(k)) ?? "upstream";
          setStudioError(code);
          return { ok: false as const };
        }
      }

      const response = await fetch(ROUTES.supabasePlatformStudioStart, {
        method: "POST",
        credentials: "same-origin",
      });
      const json = (await response.json()) as {
        ok: boolean;
        studioUrl?: string;
        embedUrl?: string;
        error?: string;
      };
      if (!response.ok || !json.ok || !json.embedUrl) {
        setStudioError(json.error ?? "upstream");
        return { ok: false as const };
      }
      setStudioUrl(json.embedUrl);
      return { ok: true as const, studioUrl: json.embedUrl };
    } catch {
      setStudioError("network");
      return { ok: false as const };
    } finally {
      setStudioStarting(false);
    }
  }, []);

  const clearStudio = useCallback(() => {
    setStudioUrl(null);
    setStudioError(null);
  }, []);

  const adoptStudioUrl = useCallback((embedUrl: string) => {
    const trimmed = embedUrl.trim();
    if (trimmed.length === 0) {
      return;
    }
    setStudioError(null);
    setStudioUrl(trimmed);
  }, []);

  return {
    status,
    connections,
    connection,
    projects,
    projectsLoading,
    dockerEnsuring,
    dockerError,
    studioStarting,
    studioError,
    studioUrl,
    refresh,
    connect,
    disconnect,
    setActiveAccount,
    selectProject,
    startStudio,
    clearStudio,
    adoptStudioUrl,
  };
}
