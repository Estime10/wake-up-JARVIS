import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  status: z.enum(["active", "disabled"]),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Interrupteur active / disabled (pas needs_reauth ici). */
export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasSupabaseServiceRole()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const { id } = await context.params;
  const idResult = z.string().uuid().safeParse(id);
  if (!idResult.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
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
    .eq("id", idResult.data)
    .maybeSingle();

  if (loadError || !account) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("admin_mail_account_set_status", {
    p_user_id: access.user.id,
    p_account_id: idResult.data,
    p_status: parsed.status,
  });

  if (error) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
