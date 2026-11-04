import { NextResponse } from "next/server";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { supabasePlatformConnectionSchema } from "@/lib/schemas";
import { hasSupabaseServiceRole } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  account_label: string;
  status: string;
  selected_project_ref: string | null;
  selected_project_name: string | null;
  is_active: boolean;
  connected_at: string;
};

function mapConnection(row: Row) {
  return supabasePlatformConnectionSchema.parse({
    id: row.id,
    accountLabel: row.account_label,
    status: row.status,
    selectedProjectRef: row.selected_project_ref,
    selectedProjectName: row.selected_project_name,
    isActive: row.is_active,
    connectedAt: row.connected_at,
  });
}

/** Liste des comptes platform connectés (+ compte actif). */
export async function GET() {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("supabase_platform_connections")
    .select(
      "id, account_label, status, selected_project_ref, selected_project_name, is_active, connected_at",
    )
    .order("connected_at", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 500 });
  }

  const connections = ((rows ?? []) as Row[]).map(mapConnection);
  const active = connections.find((item) => item.isActive) ?? null;

  return NextResponse.json({
    ok: true,
    connections,
    connection: active,
    connected: connections.length > 0,
  });
}
