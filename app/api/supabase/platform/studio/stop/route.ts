import { NextResponse } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";
import { stopLocalSupabaseStudio } from "@/lib/supabase/platform/localStudio";

export const runtime = "nodejs";
export const maxDuration = 180;

const log = createLogger("api.supabase.platform.studio.stop");

/**
 * `supabase stop` — Dev / ALLOW_LOCAL_STUDIO uniquement.
 */
export async function POST() {
  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const result = await stopLocalSupabaseStudio(process.cwd());
  if (!result.ok) {
    log.error("studio_stop_failed", {
      reason: result.reason,
      ...(result.detail ? { detail: result.detail } : {}),
    });
    const status = result.reason === "disabled" ? 403 : 500;
    return NextResponse.json({ ok: false, error: result.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    alreadyStopped: result.alreadyStopped,
  });
}
