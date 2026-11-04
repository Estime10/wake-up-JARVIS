import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";
import { supabasePlatformConnectionSchema } from "@/lib/schemas";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";
import { listSupabasePlatformProjects } from "@/lib/supabase/platform/managementApi";

export const runtime = "nodejs";

const log = createLogger("api.supabase.platform.connect");

const bodySchema = z.object({
  token: z.string().min(20).max(512),
  /** Libellé humain du compte (Perso, Client X…) — obligatoire multi-comptes. */
  accountLabel: z.string().min(1).max(80),
});

/** Ajoute un compte platform (nouveau token Vault). */
export async function POST(request: NextRequest) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "body" }, { status: 400 });
  }

  const token = parsed.token.trim();
  const accountLabel = parsed.accountLabel.trim();
  const projects = await listSupabasePlatformProjects(token);
  if (!projects.ok) {
    const status =
      projects.reason === "unauthorized"
        ? 401
        : projects.reason === "forbidden"
          ? 403
          : 502;
    return NextResponse.json({ ok: false, error: projects.reason }, { status });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(
    "admin_supabase_platform_connection_store_token",
    {
      p_user_id: access.user.id,
      p_account_label: accountLabel,
      p_token: token,
    },
  );

  if (error || !data) {
    if (error?.message.includes("supabase_platform_connection_limit")) {
      return NextResponse.json({ ok: false, error: "limit" }, { status: 409 });
    }
    log.error("store_token_failed");
    return NextResponse.json({ ok: false, error: "store" }, { status: 500 });
  }

  const row = data as {
    id: string;
    account_label: string;
    status: string;
    selected_project_ref: string | null;
    selected_project_name: string | null;
    is_active: boolean;
    connected_at: string;
  };

  return NextResponse.json({
    ok: true,
    connection: supabasePlatformConnectionSchema.parse({
      id: row.id,
      accountLabel: row.account_label,
      status: row.status,
      selectedProjectRef: row.selected_project_ref,
      selectedProjectName: row.selected_project_name,
      isActive: row.is_active,
      connectedAt: row.connected_at,
    }),
    projects: projects.data.map((project) => ({
      id: project.id,
      name: project.name,
      ref: project.ref,
      ...(project.region ? { region: project.region } : {}),
    })),
  });
}
