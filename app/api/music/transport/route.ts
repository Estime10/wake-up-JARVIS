import { NextRequest, NextResponse } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { assertSameOrigin } from "@/lib/http/assertSameOrigin";
import { createLogger } from "@/lib/logger";
import { controlMacNowPlaying } from "@/lib/music/mac/controlMacNowPlaying";
import { musicTransportRequestSchema } from "@/lib/music/musicTransportAction";

export const runtime = "nodejs";

const log = createLogger("api.music.transport");

/**
 * Transport Now Playing hôte — toggle / next / previous.
 * Fallback web/dev ; le shell packagé passe par invoke Rust.
 */
export async function POST(request: NextRequest) {
  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json(
      { ok: false, error: "origin_mismatch" },
      { status: 403 },
    );
  }

  const parsed = musicTransportRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  try {
    const result = await controlMacNowPlaying(parsed.data.action);
    return NextResponse.json({
      ok: true as const,
      accepted: result.ok,
      snapshot: result.snapshot,
    });
  } catch (error) {
    log.error("transport_failed", {
      action: parsed.data.action,
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { ok: false, error: "transport_failed" },
      { status: 500 },
    );
  }
}
