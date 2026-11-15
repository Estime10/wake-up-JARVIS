import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { loadSupabasePlatformToken } from "@/lib/supabase/platform/connectionToken";
import { ensureSelectedPlatformProject } from "@/lib/supabase/platform/ensureSelectedPlatformProject";

export const runtime = "nodejs";

const bodySchema = z.object({
  connectionId: z.string().uuid().optional(),
  projectRef: z.string().min(1).max(64).optional(),
  projectName: z.string().min(1).max(200).optional(),
});

/**
 * Prépare le lancement Studio local : project_ref + access token.
 * Body optionnel : force le compte/projet cliqués (évite le « toujours le 1er »).
 */
export async function POST(request: NextRequest) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  let parsed: z.infer<typeof bodySchema> = {};
  try {
    const raw: unknown = await request.json();
    parsed = bodySchema.parse(raw ?? {});
  } catch {
    // Body vide OK — repli sur la connexion active.
  }

  if (parsed.connectionId && parsed.projectRef) {
    const selected = await ensureSelectedPlatformProject({
      userId: access.user.id,
      connectionId: parsed.connectionId,
      projectRef: parsed.projectRef,
      projectName: parsed.projectName ?? parsed.projectRef,
    });
    if (!selected.ok) {
      return NextResponse.json({ ok: false, error: "store" }, { status: 500 });
    }
  }

  const loaded = await loadSupabasePlatformToken(parsed.connectionId);
  if (!loaded.ok) {
    const status =
      loaded.reason === "auth"
        ? 401
        : loaded.reason === "missing" || loaded.reason === "needs_reauth"
          ? 409
          : 500;
    return NextResponse.json({ ok: false, error: loaded.reason }, { status });
  }

  const projectRef =
    parsed.projectRef?.trim() || loaded.selectedProjectRef?.trim() || "";
  if (projectRef.length === 0) {
    return NextResponse.json(
      { ok: false, error: "no_project" },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    projectRef,
    projectName: parsed.projectName ?? loaded.selectedProjectName,
    connectionId: loaded.connectionId,
    accessToken: loaded.token,
  });
}
