import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { mapPool } from "@/lib/async/mapPool";
import { ownerAccessDeniedResponse } from "@/lib/auth/ownerAccessResponse";
import { requireOwnerAccess } from "@/lib/auth/requireOwnerAccess";
import { hasGoogleOAuthEnv } from "@/lib/google/env";
import { fetchGmailMessageSnippet } from "@/lib/google/gmail";
import { refreshGoogleAccessToken } from "@/lib/google/refreshAccessToken";
import { createLogger } from "@/lib/logger";
import {
  createSupabaseAdminClient,
  hasSupabaseServiceRole,
} from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const log = createLogger("mail.excerpts");

const bodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(20),
});

/**
 * Extraits Gmail éphémères (H2) — jamais persistés.
 * Réponse live pour affichage / annonce ; disparaît avec la session UI.
 */
export async function POST(request: NextRequest) {
  if (!hasGoogleOAuthEnv() || !hasSupabaseServiceRole()) {
    return NextResponse.json({ error: "config" }, { status: 503 });
  }

  const access = await requireOwnerAccess();
  if (!access.ok) {
    return ownerAccessDeniedResponse(access);
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("mail_items")
    .select("id, account_id, gmail_message_id")
    .in("id", parsed.data.ids);

  if (error) {
    log.error("items_select_failed", { message: error.message });
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  const items = rows ?? [];
  if (items.length === 0) {
    return NextResponse.json({ excerpts: {} satisfies Record<string, string> });
  }

  const admin = createSupabaseAdminClient();
  const byAccount = new Map<string, typeof items>();
  for (const item of items) {
    const list = byAccount.get(item.account_id) ?? [];
    list.push(item);
    byAccount.set(item.account_id, list);
  }

  const excerpts: Record<string, string> = {};

  for (const [accountId, accountItems] of byAccount) {
    const { data: token, error: tokenError } = await admin.rpc(
      "admin_mail_account_read_token",
      { p_user_id: access.user.id, p_account_id: accountId },
    );
    if (tokenError || typeof token !== "string" || !token) {
      log.warn("token_unavailable", { accountId });
      continue;
    }

    const refreshed = await refreshGoogleAccessToken(token);
    if (!refreshed.ok) {
      log.warn("token_refresh_failed", {
        accountId,
        reason: refreshed.reason,
      });
      continue;
    }

    const snippets = await mapPool(accountItems, 4, async (item) => {
      const snippet = await fetchGmailMessageSnippet(
        refreshed.accessToken,
        item.gmail_message_id,
      );
      return snippet ? ({ id: item.id as string, snippet } as const) : null;
    });

    for (const entry of snippets) {
      if (entry) {
        excerpts[entry.id] = entry.snippet;
      }
    }
  }

  return NextResponse.json({ excerpts });
}
