import { NextResponse } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";
import { ensureDockerRunning } from "@/lib/supabase/platform/localStudio";

export const runtime = "nodejs";
export const maxDuration = 120;

const log = createLogger("api.supabase.platform.docker.ensure");

/**
 * Vérifie que Docker tourne ; le lance (macOS) sinon.
 * Appelé au clic projet.
 */
export async function POST() {
  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const result = await ensureDockerRunning();
  if (!result.ok) {
    log.error("docker_ensure_failed", { reason: result.reason });
    const status =
      result.reason === "disabled"
        ? 403
        : result.reason === "docker_missing"
          ? 503
          : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    startedDocker: result.startedDocker,
    alreadyRunning: result.alreadyRunning,
  });
}
