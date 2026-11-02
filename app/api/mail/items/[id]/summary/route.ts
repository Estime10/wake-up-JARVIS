import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { createLocalSummary } from "@/features/mail/services/createLocalSummary";
import { hasGoogleOAuthEnv } from "@/lib/google/env";
import { fetchGmailMessagePlainText } from "@/lib/google/gmail";
import { refreshGoogleAccessToken } from "@/lib/google/refreshAccessToken";
import { createLogger } from "@/lib/logger";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const log = createLogger("mail.summary");

const bodySchema = z.object({
  consent: z.literal(true),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Résumé sur consentement explicite — fetch corps → SummaryPort → jette le corps.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  if (!hasGoogleOAuthEnv() || !hasSupabaseServiceRole()) {
    return NextResponse.json({ error: "config" }, { status: 503 });
  }

  const { id: mailItemId } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "consent_required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: item, error: itemError } = await supabase
    .from("mail_items")
    .select("id, account_id, gmail_message_id, subject, summary")
    .eq("id", mailItemId)
    .maybeSingle();

  if (itemError || !item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await supabase.from("mail_reads").insert({
    user_id: user.id,
    mail_item_id: mailItemId,
    action: "summary_yes",
  });

  if (item.summary) {
    return NextResponse.json({ summary: item.summary });
  }

  const admin = createSupabaseAdminClient();
  const { data: account } = await admin
    .from("mail_accounts")
    .select("id, vault_secret_id, status")
    .eq("id", item.account_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!account || account.status === "needs_reauth") {
    return NextResponse.json({ error: "account" }, { status: 409 });
  }

  const { data: token } = await admin.rpc("admin_mail_account_read_token", {
    p_secret_id: account.vault_secret_id,
  });

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "token" }, { status: 500 });
  }

  const access = await refreshGoogleAccessToken(token);
  if (!access.ok) {
    if (access.reason === "invalid_grant") {
      await admin.rpc("admin_mail_account_set_status", {
        p_account_id: account.id,
        p_status: "needs_reauth",
      });
    }
    return NextResponse.json({ error: "google" }, { status: 502 });
  }

  const bodyText = await fetchGmailMessagePlainText(
    access.accessToken,
    item.gmail_message_id,
  );
  if (!bodyText) {
    return NextResponse.json({ error: "empty_body" }, { status: 422 });
  }

  const summaryPort = createLocalSummary();
  const summary = await summaryPort.summarize({
    subject: item.subject ?? "",
    bodyText,
  });
  // bodyText sort du scope — non persisté.

  const { data: stored, error: storeError } = await admin.rpc(
    "admin_mail_item_store_summary",
    {
      p_user_id: user.id,
      p_mail_item_id: mailItemId,
      p_summary: summary,
    },
  );

  if (storeError) {
    log.error("store_summary_failed", { message: storeError.message });
    return NextResponse.json({ error: "store" }, { status: 500 });
  }

  return NextResponse.json({
    summary: (stored as { summary?: string } | null)?.summary ?? summary,
  });
}

/** Refuse le résumé — journalise seulement, aucun fetch Gmail. */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: mailItemId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("mail_reads").insert({
    user_id: user.id,
    mail_item_id: mailItemId,
    action: "summary_no",
  });

  if (error) {
    return NextResponse.json({ error: "journal" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
