import { NextResponse } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";
import { startLocalSupabaseStudio } from "@/lib/supabase/platform/localStudio";

export const runtime = "nodejs";
export const maxDuration = 300;

const log = createLogger("api.supabase.platform.studio.start");

/**
 * Démarre Docker si besoin + `supabase start` (Studio local).
 * Dev / ALLOW_LOCAL_STUDIO uniquement.
 * Si stack déjà up / port occupé mais Studio joignable → OK.
 */
export async function POST() {
  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
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
    return NextResponse.json(
      {
        ok: false,
        error: result.reason,
        ...(result.detail ? { detail: result.detail } : {}),
      },
      { status },
    );
  }

  return NextResponse.json({
    ok: true,
    studioUrl: result.studioUrl,
    embedUrl: result.embedUrl,
    startedDocker: result.startedDocker,
    alreadyRunning: result.alreadyRunning,
  });
}
