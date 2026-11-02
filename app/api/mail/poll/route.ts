import { NextResponse } from "next/server";

import {
  loadMailRulesForUser,
  pollMailAccount,
  type PollAccountRow,
} from "@/features/mail/services/pollMailAccount";
import { hasGoogleOAuthEnv } from "@/lib/google/env";
import { createLogger } from "@/lib/logger";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const log = createLogger("mail.poll.route");

/**
 * Relève Gmail des boîtes actives de l’utilisateur connecté.
 * Cron global (pg_cron) : à brancher plus tard via secret dédié.
 */
export async function POST() {
  if (!hasGoogleOAuthEnv() || !hasSupabaseServiceRole()) {
    return NextResponse.json({ error: "config" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const { data: accounts, error } = await admin
    .from("mail_accounts")
    .select("id, user_id, vault_secret_id, gmail_history_id, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    log.error("list_accounts_failed", { message: error.message });
    return NextResponse.json({ error: "list" }, { status: 500 });
  }

  const rules = await loadMailRulesForUser(user.id);
  const results = [];

  for (const row of (accounts ?? []) as PollAccountRow[]) {
    results.push(await pollMailAccount(row, rules));
  }

  log.info("poll_done", { user: user.id, accounts: results.length });
  return NextResponse.json({ results });
}
