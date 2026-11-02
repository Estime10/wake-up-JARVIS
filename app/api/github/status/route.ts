import { NextResponse } from "next/server";

import { githubConnectionSchema, type GithubConnection } from "@/lib/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type Row = {
  id: string;
  github_login: string;
  status: string;
  expires_at: string | null;
  connected_at: string;
};

/**
 * Statut connexion GitHub (sans PAT / sans vault_secret_id).
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("github_connections")
    .select("id, github_login, status, expires_at, connected_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ ok: true, connected: false as const });
  }

  const row = data as Row;
  let status = row.status;
  if (
    status === "active" &&
    row.expires_at &&
    Date.parse(row.expires_at) < Date.now()
  ) {
    status = "needs_reauth";
  }

  const connection: GithubConnection = githubConnectionSchema.parse({
    id: row.id,
    login: row.github_login,
    status,
    expiresAt: row.expires_at,
    connectedAt: row.connected_at,
  });

  return NextResponse.json({
    ok: true,
    connected: true as const,
    connection,
  });
}
