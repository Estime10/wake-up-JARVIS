import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { fetchGithubUser } from "@/lib/github/user";
import { createLogger } from "@/lib/logger";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const log = createLogger("api.github.connect");

const bodySchema = z.object({
  /** Fine-grained PAT — jamais renvoyé ni loggé. */
  token: z.string().min(20).max(512),
  /** Expiration déclarée (notice UI) ; optionnel. */
  expiresAt: z.iso.datetime({ offset: true }).optional(),
});

/**
 * Enregistre / remplace le PAT GitHub (Vault).
 * Valide d’abord via GET /user.
 */
export async function POST(request: NextRequest) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "auth" }, { status: 401 });
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "body" }, { status: 400 });
  }

  const token = parsed.token.trim();
  const github = await fetchGithubUser(token);
  if (!github.ok) {
    const status =
      github.reason === "unauthorized"
        ? 401
        : github.reason === "forbidden"
          ? 403
          : 502;
    return NextResponse.json({ ok: false, error: github.reason }, { status });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc(
    "admin_github_connection_store_token",
    {
      p_user_id: user.id,
      p_github_user_id: github.user.id,
      p_github_login: github.user.login,
      p_token: token,
      p_expires_at: parsed.expiresAt ?? null,
    },
  );

  if (error || !data) {
    log.error("store_token_failed");
    return NextResponse.json({ ok: false, error: "store" }, { status: 500 });
  }

  const row = data as {
    id: string;
    github_login: string;
    status: string;
    expires_at: string | null;
    connected_at: string;
  };

  return NextResponse.json({
    ok: true,
    connection: {
      id: row.id,
      login: row.github_login,
      status: row.status,
      expiresAt: row.expires_at,
      connectedAt: row.connected_at,
    },
  });
}
