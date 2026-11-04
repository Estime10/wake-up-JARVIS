import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { createLogger } from "@/lib/logger";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

const log = createLogger("api.supabase.platform.disconnect");

const bodySchema = z.object({
  connectionId: z.string().uuid(),
});

/** Supprime un compte platform + secret Vault. */
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

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc(
    "admin_supabase_platform_connection_delete",
    {
      p_user_id: access.user.id,
      p_connection_id: parsed.connectionId,
    },
  );

  if (error) {
    log.error("delete_failed");
    return NextResponse.json({ ok: false, error: "store" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
