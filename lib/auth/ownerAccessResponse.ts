import type { NextResponse } from "next/server";

import type { OwnerAccessDenied } from "@/lib/auth/evaluateOwnerAccess";
import { jsonNoStore } from "@/lib/http/jsonNoStore";

/** Réponse JSON homogène pour la garde propriétaire. */
export function ownerAccessDeniedResponse(
  denied: OwnerAccessDenied,
): NextResponse {
  return jsonNoStore(
    { ok: false, error: denied.error },
    { status: denied.status },
  );
}
