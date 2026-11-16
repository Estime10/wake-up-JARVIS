import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { loadSupabasePlatformToken } from "@/lib/supabase/platform/connectionToken";
import { ensureSelectedPlatformProject } from "@/lib/supabase/platform/ensureSelectedPlatformProject";
import {
  startLocalSupabaseStudio,
  syncLocalSchemaFromCloud,
} from "@/lib/supabase/platform/localStudio";
import { localStudioBrowserUrl } from "@/lib/supabase/platform/localStudioUrl";

export const runtime = "nodejs";
export const maxDuration = 300;

const log = createLogger("api.supabase.platform.studio.start");

const bodySchema = z.object({
  connectionId: z.string().uuid().optional(),
  projectRef: z.string().min(1).max(64).optional(),
  projectName: z.string().min(1).max(200).optional(),
});

/**
 * Docker → start → sync schéma cloud (dump/apply) → URL Studio local.
 * Body optionnel : compte/projet cliqués (pas seulement l’actif en DB).
 */
export async function POST(request: NextRequest) {
  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  let parsed: z.infer<typeof bodySchema> = {};
  try {
    const raw: unknown = await request.json();
    parsed = bodySchema.parse(raw ?? {});
  } catch {
    // body vide OK
  }

  if (parsed.connectionId && parsed.projectRef) {
    const selected = await ensureSelectedPlatformProject({
      userId: access.user.id,
      connectionId: parsed.connectionId,
      projectRef: parsed.projectRef,
      projectName: parsed.projectName ?? parsed.projectRef,
    });
    if (!selected.ok) {
      log.error("select_project_before_start_failed");
      return NextResponse.json({ ok: false, error: "store" }, { status: 500 });
    }
  }

  const loaded = await loadSupabasePlatformToken(parsed.connectionId);
  if (!loaded.ok) {
    return NextResponse.json(
      { ok: false, error: loaded.reason },
      { status: 409 },
    );
  }

  const projectRef =
    parsed.projectRef?.trim() || loaded.selectedProjectRef?.trim() || "";
  if (projectRef.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no_project" },
      { status: 409 },
    );
  }

  const result = await startLocalSupabaseStudio(process.cwd());
  if (!result.ok) {
    log.error("studio_start_failed", {
      reason: result.reason,
      ...(result.detail ? { detail: result.detail } : {}),
    });
    const status =
      result.reason === "disabled"
        ? 403
        : result.reason === "docker_missing" || result.reason === "port_in_use"
          ? 503
          : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  const synced = await syncLocalSchemaFromCloud(
    process.cwd(),
    projectRef,
    loaded.token,
  );
  if (!synced.ok) {
    log.error("studio_sync_failed", { reason: synced.reason, projectRef });
    return NextResponse.json(
      { ok: false, error: synced.reason },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    studioUrl: localStudioBrowserUrl(projectRef),
    embedUrl: result.embedUrl,
    projectRef,
    synced: !synced.skipped,
    startedDocker: result.startedDocker,
    alreadyRunning: result.alreadyRunning,
  });
}
