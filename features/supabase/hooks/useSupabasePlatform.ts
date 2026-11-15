"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { openExternalUrl } from "@/features/home/tauri/openExternal";
import {
  launchLocalStudioStaged,
  type StudioLaunchPhase,
} from "@/features/home/tauri/studioEnsure";
import { STUDIO_PHASE_SPEAK_KEYS } from "@/features/supabase/model/studioLaunchPhases";
import { ROUTES } from "@/lib/routes";
import { isTauri } from "@/lib/runtime/isTauri";
import {
  supabasePlatformConnectionSchema,
  supabasePlatformProjectSchema,
  type SupabasePlatformConnection,
  type SupabasePlatformProjectSummary,
} from "@/lib/schemas";
import { t } from "@/lib/i18n/t";
import { localStudioBrowserUrl } from "@/lib/supabase/platform/localStudioUrl";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

const STUDIO_ENSURE_ERRORS = [
  "not_running",
  "docker_missing",
  "docker_start_failed",
  "supabase_start_failed",
  "port_in_use",
  "repo_missing",
  "no_project",
  "pull_failed",
  "sync_failed",
  "link_failed",
] as const;

export type SupabasePlatformStatus =
  "loading" | "ready" | "error" | "unavailable";

export type UseSupabasePlatformResult = {
  status: SupabasePlatformStatus;
  connections: SupabasePlatformConnection[];
  /** Compte actif (session). */
  connection: SupabasePlatformConnection | null;
  /** Projets cloud par connectionId — tous les comptes visibles d’un coup. */
  projectsByConnectionId: Record<string, SupabasePlatformProjectSummary[]>;
  /** connectionIds dont le fetch projets est en cours. */
  projectsLoadingIds: ReadonlySet<string>;
  studioStarting: boolean;
  /** Étape courante du pipeline Docker → stack → sync → navigateur. */
  studioPhase: StudioLaunchPhase | null;
  studioError: string | null;
  /** Toujours `null` — Studio s’ouvre dans le navigateur, plus d’embed. */
  studioUrl: string | null;
  refresh: () => void;
  connect: (input: {
    token: string;
    accountLabel: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  disconnect: (connectionId: string) => Promise<boolean>;
  setActiveAccount: (connectionId: string) => Promise<boolean>;
  selectProject: (
    connectionId: string,
    project: SupabasePlatformProjectSummary,
  ) => Promise<boolean>;
  startStudio: () => Promise<{ ok: true; studioUrl: string } | { ok: false }>;
  /** Branche la voix ELSA sur les annonces d’étapes Studio. */
  setStudioSpeakAlert: (
    speak: ((text: string) => Promise<boolean>) | null,
  ) => void;
  /** No-op conservé pour intents assistant (plus d’embed). */
  clearStudio: () => void;
  /** Ouvre Studio cloud dans le navigateur (intent assistant). */
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
  const [projectsByConnectionId, setProjectsByConnectionId] = useState<
    Record<string, SupabasePlatformProjectSummary[]>
  >({});
  const [projectsLoadingIds, setProjectsLoadingIds] = useState<
    ReadonlySet<string>
  >(() => new Set());
  const [studioStarting, setStudioStarting] = useState(false);
  const [studioPhase, setStudioPhase] = useState<StudioLaunchPhase | null>(
    null,
  );
  const [studioError, setStudioError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const selectionRef = useRef<{
    connectionId: string;
    projectRef: string;
  } | null>(null);
  const speakAlertRef = useRef<((text: string) => Promise<boolean>) | null>(
    null,
  );

  const setStudioSpeakAlert = useCallback(
    (speak: ((text: string) => Promise<boolean>) | null) => {
      speakAlertRef.current = speak;
    },
    [],
  );

  const announcePhase = useCallback(async (phase: StudioLaunchPhase) => {
    setStudioPhase(phase);
    const key = STUDIO_PHASE_SPEAK_KEYS[phase];
    const speak = speakAlertRef.current;
    if (!key || !speak) {
      return;
    }
    try {
      await speak(t(key));
    } catch {
      // Voix optionnelle — le pipeline continue.
    }
  }, []);

  const connection = connections.find((item) => item.isActive) ?? null;

  useEffect(() => {
    if (connection?.selectedProjectRef) {
      selectionRef.current = {
        connectionId: connection.id,
        projectRef: connection.selectedProjectRef,
      };
      return;
    }
    selectionRef.current = null;
  }, [connection]);

  const refresh = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const markLoading = useCallback(
    (connectionIds: string[], loading: boolean) => {
      setProjectsLoadingIds((prev) => {
        const next = new Set(prev);
        for (const id of connectionIds) {
          if (loading) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
        return next;
      });
    },
    [],
  );

  const fetchProjectsForConnection = useCallback(
    async (connectionId: string): Promise<SupabasePlatformProjectSummary[]> => {
      const url = new URL(
        ROUTES.supabasePlatformProjects,
        window.location.origin,
      );
      url.searchParams.set("connectionId", connectionId);
      const response = await fetch(url.toString(), {
        credentials: "same-origin",
      });
      if (!response.ok) {
        return [];
      }
      const json = (await response.json()) as {
        ok: boolean;
        projects?: unknown[];
      };
      if (!json.ok || !json.projects) {
        return [];
      }
      return json.projects.map((item) =>
        supabasePlatformProjectSchema.parse(item),
      );
    },
    [],
  );

  const loadProjectsForConnections = useCallback(
    async (connectionIds: string[]) => {
      if (connectionIds.length === 0) {
        setProjectsByConnectionId({});
        return;
      }
      markLoading(connectionIds, true);
      try {
        const settled = await Promise.all(
          connectionIds.map(async (connectionId) => {
            try {
              const projects = await fetchProjectsForConnection(connectionId);
              return { connectionId, projects };
            } catch {
              return {
                connectionId,
                projects: [] as SupabasePlatformProjectSummary[],
              };
            }
          }),
        );
        setProjectsByConnectionId((prev) => {
          const next = { ...prev };
          for (const item of settled) {
            next[item.connectionId] = item.projects;
          }
          return next;
        });
      } finally {
        markLoading(connectionIds, false);
      }
    },
    [fetchProjectsForConnection, markLoading],
  );

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
          setProjectsByConnectionId({});
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
        if (!cancelled) {
          await loadProjectsForConnections(list.map((item) => item.id));
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
  }, [attempt, loadProjectsForConnections]);

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
          // Plus récent en tête (aligné status `connected_at` desc).
          return [created, ...cleared];
        });
        const createdProjects = json.projects;
        if (createdProjects) {
          setProjectsByConnectionId((prev) => ({
            ...prev,
            [created.id]: createdProjects.map((item) =>
              supabasePlatformProjectSchema.parse(item),
            ),
          }));
        } else {
          void loadProjectsForConnections([created.id]);
        }
        setStatus("ready");
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: "network" };
      }
    },
    [loadProjectsForConnections],
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
      setProjectsByConnectionId((prev) => {
        const next = { ...prev };
        delete next[connectionId];
        return next;
      });
      setStudioError(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const setActiveAccount = useCallback(async (connectionId: string) => {
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
      return true;
    } catch {
      return false;
    }
  }, []);

  const selectProject = useCallback(
    async (connectionId: string, project: SupabasePlatformProjectSummary) => {
      try {
        const response = await fetch(ROUTES.supabasePlatformSelectProject, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            connectionId,
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
        if (updated.selectedProjectRef) {
          selectionRef.current = {
            connectionId: updated.id,
            projectRef: updated.selectedProjectRef,
          };
        }
        setConnections((prev) =>
          prev.map((item) =>
            item.id === updated.id ? updated : { ...item, isActive: false },
          ),
        );
        setStudioError(null);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const startStudio = useCallback(async () => {
    setStudioStarting(true);
    setStudioError(null);
    setStudioPhase(null);
    const selection = selectionRef.current;
    const selectedRef = selection?.projectRef ?? null;
    const selectedConnectionId = selection?.connectionId ?? null;
    const projectName =
      connections.find((c) => c.id === selectedConnectionId)
        ?.selectedProjectName ?? selectedRef;
    if (!selectedRef || !selectedConnectionId) {
      setStudioStarting(false);
      setStudioError("no_project");
      return { ok: false as const };
    }

    const launchBody = {
      connectionId: selectedConnectionId,
      projectRef: selectedRef,
      projectName: projectName ?? selectedRef,
    };

    try {
      let url = localStudioBrowserUrl(selectedRef);

      if (isTauri()) {
        const prepareResponse = await fetch(
          ROUTES.supabasePlatformStudioPrepare,
          {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(launchBody),
          },
        );
        const prepareJson = (await prepareResponse.json()) as {
          ok?: boolean;
          projectRef?: string;
          accessToken?: string;
          error?: string;
        };
        if (
          !prepareResponse.ok ||
          !prepareJson.ok ||
          !prepareJson.accessToken
        ) {
          setStudioError(prepareJson.error ?? "no_project");
          return { ok: false as const };
        }

        try {
          await launchLocalStudioStaged(
            {
              projectRef: selectedRef,
              accessToken: prepareJson.accessToken,
            },
            announcePhase,
          );
        } catch (error) {
          const message =
            typeof error === "string"
              ? error
              : error instanceof Error
                ? error.message
                : "not_running";
          const code =
            STUDIO_ENSURE_ERRORS.find((k) => message.includes(k)) ?? "upstream";
          setStudioError(code);
          return { ok: false as const };
        }
        url = localStudioBrowserUrl(selectedRef);
      } else {
        await announcePhase("docker");
        const dockerResponse = await fetch(
          ROUTES.supabasePlatformDockerEnsure,
          { method: "POST", credentials: "same-origin" },
        );
        const dockerJson = (await dockerResponse.json()) as {
          ok?: boolean;
          error?: string;
        };
        if (!dockerResponse.ok || !dockerJson.ok) {
          setStudioError(dockerJson.error ?? "docker_start_failed");
          return { ok: false as const };
        }
        await announcePhase("docker_ready");

        await announcePhase("stack");
        const response = await fetch(ROUTES.supabasePlatformStudioStart, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(launchBody),
        });
        const json = (await response.json()) as {
          ok?: boolean;
          studioUrl?: string;
          projectRef?: string;
          error?: string;
        };
        if (!response.ok || !json.ok) {
          setStudioError(json.error ?? "upstream");
          return { ok: false as const };
        }
        await announcePhase("stack_ready");
        await announcePhase("sync_done");
        url = localStudioBrowserUrl(json.projectRef ?? selectedRef);
      }

      await announcePhase("browser");
      await openExternalUrl(url);
      await announcePhase("done");
      return { ok: true as const, studioUrl: url };
    } catch {
      setStudioError("network");
      return { ok: false as const };
    } finally {
      setStudioStarting(false);
      setStudioPhase(null);
    }
  }, [announcePhase, connections]);

  const clearStudio = useCallback(() => {
    setStudioError(null);
  }, []);

  const adoptStudioUrl = useCallback((embedUrl: string) => {
    const trimmed = embedUrl.trim();
    if (trimmed.length === 0) {
      return;
    }
    setStudioError(null);
    // Intent assistant : ouvrir l’URL locale fournie (jamais le dashboard prod).
    void openExternalUrl(trimmed).catch(() => {
      setStudioError("network");
    });
  }, []);

  return {
    status,
    connections,
    connection,
    projectsByConnectionId,
    projectsLoadingIds,
    studioStarting,
    studioPhase,
    studioError,
    studioUrl: null,
    refresh,
    connect,
    disconnect,
    setActiveAccount,
    selectProject,
    startStudio,
    setStudioSpeakAlert,
    clearStudio,
    adoptStudioUrl,
  };
}
