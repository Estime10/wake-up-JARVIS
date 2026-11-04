import {
  loadMailRulesForUser,
  pollMailAccount,
  type PollAccountRow,
} from "@/features/mail/services/pollMailAccount";
import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { hasGoogleOAuthEnv } from "@/lib/google/env";
import { jsonNoStore } from "@/lib/http/jsonNoStore";
import { createLogger } from "@/lib/logger";
import { consumeMailPollSlot } from "@/lib/mail/pollRateLimit";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

const log = createLogger("mail.poll.route");

/**
 * Relève Gmail des boîtes actives de l’utilisateur connecté.
 * Rate-limité (~1 / min / user) — M2.
 */
export async function POST() {
  if (!hasGoogleOAuthEnv() || !hasSupabaseServiceRole()) {
    return jsonNoStore({ error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const slot = consumeMailPollSlot(access.user.id);
  if (!slot.ok) {
    return jsonNoStore(
      { error: "rate_limited", retryAfterMs: slot.retryAfterMs },
      { status: 429 },
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: accounts, error } = await admin
    .from("mail_accounts")
    .select("id, user_id, gmail_history_id, status")
    .eq("user_id", access.user.id)
    .eq("status", "active");

  if (error) {
    log.error("list_accounts_failed", { message: error.message });
    return jsonNoStore({ error: "list" }, { status: 500 });
  }

  const rules = await loadMailRulesForUser(access.user.id);
  const results = [];

  for (const row of (accounts ?? []) as PollAccountRow[]) {
    results.push(await pollMailAccount(row, rules));
  }

  log.info("poll_done", { user: access.user.id, accounts: results.length });
  return jsonNoStore({ results });
}
