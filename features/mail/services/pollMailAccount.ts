import "server-only";

import { classifyMail } from "@/features/mail/model/classifyMail";
import { flagUnusual } from "@/features/mail/model/flagUnusual";
import type { MailRule } from "@/features/mail/model/mailRule";
import { isGmailSentMessage } from "@/features/mail/model/isGmailSentMessage";
import { pickPrimaryUserLabel } from "@/features/mail/model/mailLabelColors";
import {
  gmailAfterDateQuery,
  isWithinMailWindow,
  startOfMailWindow,
} from "@/features/mail/model/mailWindow";
import {
  fetchGmailLabelNames,
  fetchGmailProfileHistoryId,
  listGmailMessagesByQuery,
  type GmailMessageMeta,
} from "@/lib/google/gmail";
import { refreshGoogleAccessToken } from "@/lib/google/refreshAccessToken";
import { createLogger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const log = createLogger("mail.poll");

export type PollAccountRow = {
  id: string;
  user_id: string;
  vault_secret_id: string;
  gmail_history_id: string | null;
  status: string;
};

export type PollAccountResult = {
  accountId: string;
  upserted: number;
  status: "ok" | "needs_reauth" | "error";
  detail?: string;
};

function toRules(
  rows: {
    match_type: string;
    pattern: string;
    category: string;
    priority: number;
  }[],
): MailRule[] {
  return rows.map((row) => ({
    matchType: row.match_type === "subject" ? "subject" : "sender",
    pattern: row.pattern,
    category: row.category,
    priority: row.priority,
  }));
}

function resolveCategory(
  message: GmailMessageMeta,
  labelNames: Map<string, string>,
  rules: MailRule[],
): string {
  const names = message.labelIds
    .map((id) => labelNames.get(id))
    .filter((name): name is string => Boolean(name));
  const gmailLabel = pickPrimaryUserLabel(names);
  if (gmailLabel) {
    return gmailLabel;
  }
  return classifyMail(
    { fromRaw: message.fromRaw, subject: message.subject },
    rules,
  );
}

async function persistMessages(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  account: PollAccountRow,
  messages: GmailMessageMeta[],
  rules: MailRule[],
  labelNames: Map<string, string>,
): Promise<number> {
  let upserted = 0;
  for (const message of messages) {
    if (!isWithinMailWindow(message.receivedAt)) {
      continue;
    }

    const category = resolveCategory(message, labelNames, rules);
    const flag = flagUnusual({
      fromRaw: message.fromRaw,
      subject: message.subject,
      snippet: message.snippet,
    });

    const { error } = await admin.rpc("admin_mail_item_upsert", {
      p_user_id: account.user_id,
      p_account_id: account.id,
      p_gmail_message_id: message.id,
      p_gmail_thread_id: message.threadId,
      p_from_raw: message.fromRaw,
      p_subject: message.subject,
      p_snippet: message.snippet,
      p_received_at: message.receivedAt.toISOString(),
      p_category: category,
      p_flagged: Boolean(flag),
      p_flag_reason: flag?.reason ?? null,
      p_is_sent: isGmailSentMessage(message.labelIds),
    });

    if (error) {
      log.error("upsert_failed", {
        accountId: account.id,
        message: error.message,
      });
      continue;
    }
    upserted += 1;
  }
  return upserted;
}

/**
 * Relève une boîte active — **toujours** J-2 + veille + jour via Gmail `q=after:`.
 * (Pas d’history seul : après un purge DB, history croit être à jour et ne ramène rien.)
 */
export async function pollMailAccount(
  account: PollAccountRow,
  rules: MailRule[],
): Promise<PollAccountResult> {
  const admin = createSupabaseAdminClient();

  const { error: purgeError } = await admin.rpc(
    "admin_mail_items_purge_before",
    {
      p_user_id: account.user_id,
      p_before: startOfMailWindow().toISOString(),
    },
  );
  if (purgeError) {
    log.warn("purge_before_failed", { message: purgeError.message });
  }

  const { data: token, error: tokenError } = await admin.rpc(
    "admin_mail_account_read_token",
    { p_secret_id: account.vault_secret_id },
  );

  if (tokenError || typeof token !== "string" || !token) {
    log.error("token_read_failed", { accountId: account.id });
    return {
      accountId: account.id,
      upserted: 0,
      status: "error",
      detail: "token_read",
    };
  }

  const access = await refreshGoogleAccessToken(token);
  if (!access.ok) {
    if (access.reason === "invalid_grant") {
      await admin.rpc("admin_mail_account_set_status", {
        p_account_id: account.id,
        p_status: "needs_reauth",
      });
      return {
        accountId: account.id,
        upserted: 0,
        status: "needs_reauth",
      };
    }
    return {
      accountId: account.id,
      upserted: 0,
      status: "error",
      detail: access.message,
    };
  }

  const query = gmailAfterDateQuery();
  const [messages, labelNames] = await Promise.all([
    listGmailMessagesByQuery(access.accessToken, query),
    fetchGmailLabelNames(access.accessToken),
  ]);
  log.info("window_fetched", {
    accountId: account.id,
    query,
    count: messages.length,
    labels: labelNames.size,
  });

  const upserted = await persistMessages(
    admin,
    account,
    messages,
    rules,
    labelNames,
  );

  const nextHistoryId = await fetchGmailProfileHistoryId(access.accessToken);
  if (nextHistoryId) {
    await admin.rpc("admin_mail_account_set_history", {
      p_account_id: account.id,
      p_history_id: nextHistoryId,
    });
  }

  log.info("account_done", {
    accountId: account.id,
    upserted,
  });

  return { accountId: account.id, upserted, status: "ok" };
}

/** Charge règles enabled pour un user. */
export async function loadMailRulesForUser(
  userId: string,
): Promise<MailRule[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("mail_rules")
    .select("match_type, pattern, category, priority")
    .eq("user_id", userId)
    .eq("enabled", true)
    .order("priority", { ascending: true });

  if (error) {
    log.error("rules_load_failed", { message: error.message });
    return [];
  }
  return toRules(data ?? []);
}
