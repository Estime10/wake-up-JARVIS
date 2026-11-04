import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { revokeGoogleToken } from "@/lib/google/oauth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  accountId: z.string().uuid(),
});

/**
 * Débranche une boîte : révoque chez Google + purge Vault + ligne.
 * Body JSON `{ accountId }`.
 */
export async function POST(request: NextRequest) {
  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: account, error: loadError } = await supabase
    .from("mail_accounts")
    .select("id")
    .eq("id", parsed.accountId)
    .maybeSingle();

  if (loadError || !account) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { data: token } = await admin.rpc("admin_mail_account_read_token", {
    p_user_id: access.user.id,
    p_account_id: parsed.accountId,
  });

  if (typeof token === "string" && token.length > 0) {
    try {
      await revokeGoogleToken(token);
    } catch {
      /* révocation best-effort — on purge quand même localement */
    }
  }

  const { error: deleteError } = await admin.rpc("admin_mail_account_delete", {
    p_user_id: access.user.id,
    p_account_id: parsed.accountId,
  });

  if (deleteError) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
