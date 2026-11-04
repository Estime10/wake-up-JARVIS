import { NextResponse, type NextRequest } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { loadSupabasePlatformToken } from "@/lib/supabase/platform/connectionToken";
import { listSupabasePlatformProjects } from "@/lib/supabase/platform/managementApi";

export const runtime = "nodejs";

/** Projets cloud d’un compte (connectionId) ou du compte actif. */
export async function GET(request: NextRequest) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const connectionId =
    request.nextUrl.searchParams.get("connectionId") ?? undefined;

  const loaded = await loadSupabasePlatformToken(connectionId);
  if (!loaded.ok) {
    const status =
      loaded.reason === "auth"
        ? 401
        : loaded.reason === "missing" || loaded.reason === "needs_reauth"
          ? 409
          : 500;
    return NextResponse.json({ ok: false, error: loaded.reason }, { status });
  }

  const projects = await listSupabasePlatformProjects(loaded.token);
  if (!projects.ok) {
    const status =
      projects.reason === "unauthorized"
        ? 401
        : projects.reason === "forbidden"
          ? 403
          : 502;
    return NextResponse.json({ ok: false, error: projects.reason }, { status });
  }

  return NextResponse.json({
    ok: true,
    connectionId: loaded.connectionId,
    selectedProjectRef: loaded.selectedProjectRef,
    projects: projects.data.map((project) => ({
      id: project.id,
      name: project.name,
      ref: project.ref,
      ...(project.region ? { region: project.region } : {}),
    })),
  });
}
