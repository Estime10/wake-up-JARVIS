import { NextResponse } from "next/server";

import { listOAuthDebugEvents } from "@/lib/google/oauthDebugRing";

export const runtime = "nodejs";

/**
 * Journal OAuth récent (process local) — uniquement en développement.
 * Ouvrir : http://localhost:3000/api/google/oauth/debug
 */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "unavailable" }, { status: 404 });
  }

  return NextResponse.json({
    events: listOAuthDebugEvents(),
  });
}
