import { NextResponse } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";
import { probeMacNowPlaying } from "@/lib/music/mac/probeMacNowPlaying";

export const runtime = "nodejs";

const log = createLogger("api.music.now-playing");

/**
 * Snapshot Now Playing hôte (macOS) — Deezer / YouTube / etc.
 * Lecture seule : pas de contrôle transport.
 */
export async function GET() {
  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  try {
    const snapshot = probeMacNowPlaying();
    return NextResponse.json({ ok: true as const, snapshot });
  } catch (error) {
    log.error("probe_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { ok: false, error: "probe_failed" },
      { status: 500 },
    );
  }
}
