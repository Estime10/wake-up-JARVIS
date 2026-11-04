"use client";

import { ROUTES } from "@/lib/routes";
import {
  supabasePlatformConnectionSchema,
  supabasePlatformProjectSchema,
  type SupabasePlatformConnection,
  type SupabasePlatformProjectSummary,
} from "@/lib/schemas";

export type StudioLaunchResult =
  | { ok: true; projectName: string; accountLabel: string; studioUrl: string }
  | { ok: false; reason: "not_found" | "failed" | "not_connected" };

function matchesProject(
  project: SupabasePlatformProjectSummary,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  return (
    project.name.toLowerCase() === q ||
    project.ref.toLowerCase() === q ||
    project.name.toLowerCase().includes(q) ||
    project.ref.toLowerCase().includes(q)
  );
}

/**
 * Résout un projet parmi tous les comptes, bascule le compte si besoin, lance Studio.
 */
export async function launchSupabaseStudioForQuery(
  projectQuery: string,
): Promise<StudioLaunchResult> {
  const statusResponse = await fetch(ROUTES.supabasePlatformStatus, {
    credentials: "same-origin",
  });
  if (!statusResponse.ok) {
    return { ok: false, reason: "not_connected" };
  }
  const statusJson = (await statusResponse.json()) as {
    ok?: boolean;
    connections?: unknown[];
  };
  const connections = (statusJson.connections ?? [])
    .map((row) => {
      try {
        return supabasePlatformConnectionSchema.parse(row);
      } catch {
        return null;
      }
    })
    .filter((row): row is SupabasePlatformConnection => row !== null);

  if (connections.length === 0) {
    return { ok: false, reason: "not_connected" };
  }

  let match: {
    connection: SupabasePlatformConnection;
    project: SupabasePlatformProjectSummary;
  } | null = null;

  for (const connection of connections) {
    const url = new URL(
      ROUTES.supabasePlatformProjects,
      window.location.origin,
    );
    url.searchParams.set("connectionId", connection.id);
    const projectsResponse = await fetch(url, { credentials: "same-origin" });
    if (!projectsResponse.ok) {
      continue;
    }
    const projectsJson = (await projectsResponse.json()) as {
      projects?: unknown[];
    };
    for (const raw of projectsJson.projects ?? []) {
      try {
        const project = supabasePlatformProjectSchema.parse(raw);
        if (matchesProject(project, projectQuery)) {
          match = { connection, project };
          break;
        }
      } catch {
        // ignore invalid row
      }
    }
    if (match) {
      break;
    }
  }

  if (!match) {
    return { ok: false, reason: "not_found" };
  }

  if (!match.connection.isActive) {
    const activeResponse = await fetch(ROUTES.supabasePlatformSetActive, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId: match.connection.id }),
    });
    if (!activeResponse.ok) {
      return { ok: false, reason: "failed" };
    }
  }

  const selectResponse = await fetch(ROUTES.supabasePlatformSelectProject, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      connectionId: match.connection.id,
      projectRef: match.project.ref,
      projectName: match.project.name,
    }),
  });
  if (!selectResponse.ok) {
    return { ok: false, reason: "failed" };
  }

  await fetch(ROUTES.supabasePlatformDockerEnsure, {
    method: "POST",
    credentials: "same-origin",
  });

  const studioResponse = await fetch(ROUTES.supabasePlatformStudioStart, {
    method: "POST",
    credentials: "same-origin",
  });
  const studioJson = (await studioResponse.json()) as {
    ok?: boolean;
    embedUrl?: string;
    studioUrl?: string;
  };
  if (!studioResponse.ok || !studioJson.ok) {
    return { ok: false, reason: "failed" };
  }

  return {
    ok: true,
    projectName: match.project.name,
    accountLabel: match.connection.accountLabel,
    studioUrl: studioJson.embedUrl ?? studioJson.studioUrl ?? "",
  };
}
