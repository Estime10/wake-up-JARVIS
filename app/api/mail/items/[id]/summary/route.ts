import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { hasGoogleOAuthEnv } from "@/lib/google/env";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  consent: z.literal(true),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Résumé sur consentement — 501 tant qu’aucun vrai SummaryPort n’est branché.
 * Journalise le oui avant 501 ; refuse boîte inactive (gardes M6 pour plus tard).
 */
export async function POST(request: NextRequest, context: RouteContext) {
  if (!hasGoogleOAuthEnv() || !hasSupabaseServiceRole()) {
    return NextResponse.json({ error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const { id: mailItemIdRaw } = await context.params;
  const idResult = z.string().uuid().safeParse(mailItemIdRaw);
  if (!idResult.success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "consent_required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: item, error: itemError } = await supabase
    .from("mail_items")
    .select("id, account_id")
    .eq("id", idResult.data)
    .maybeSingle();

  if (itemError || !item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { error: journalError } = await supabase.from("mail_reads").insert({
    user_id: access.user.id,
    mail_item_id: idResult.data,
    action: "summary_yes",
  });

  if (journalError) {
    return NextResponse.json({ error: "journal" }, { status: 500 });
  }

  const admin = createSupabaseAdminClient();
  const { data: account } = await admin
    .from("mail_accounts")
    .select("id, status")
    .eq("id", item.account_id)
    .eq("user_id", access.user.id)
    .maybeSingle();

  if (!account || account.status !== "active") {
    return NextResponse.json({ error: "account" }, { status: 409 });
  }

  return NextResponse.json({ error: "not_implemented" }, { status: 501 });
}

/** Refuse le résumé — journalise seulement, aucun fetch Gmail. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const { id: mailItemIdRaw } = await context.params;
  const idResult = z.string().uuid().safeParse(mailItemIdRaw);
  if (!idResult.success) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("mail_reads").insert({
    user_id: access.user.id,
    mail_item_id: idResult.data,
    action: "summary_no",
  });

  if (error) {
    return NextResponse.json({ error: "journal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
