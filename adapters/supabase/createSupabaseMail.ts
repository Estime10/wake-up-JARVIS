import type { SupabaseClient } from "@supabase/supabase-js";

import { mailMatchesLabel } from "@/features/mail/model/mailMatchesLabel";
import { startOfMailWindow } from "@/features/mail/model/mailWindow";
import { mailSummarySchema, type MailSummary } from "@/lib/schemas";
import type { MailPort } from "@/ports/mail-port";

type MailItemRow = {
  id: string;
  account_id: string;
  from_raw: string;
  subject: string;
  snippet: string;
  received_at: string;
  category: string;
  is_sent: boolean;
  flagged: boolean;
  flag_reason: string | null;
  summary: string | null;
};

type MailboxFilter = "inbox" | "sent";

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "00:00";
  }
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function mapRow(row: MailItemRow): MailSummary {
  return mailSummarySchema.parse({
    id: row.id,
    accountId: row.account_id,
    from: row.from_raw,
    subject: row.subject,
    excerpt: row.summary?.trim() || row.snippet,
    time: formatTime(row.received_at),
    receivedAt: new Date(row.received_at).toISOString(),
    unread: row.flagged,
    category: row.category,
    isSent: row.is_sent,
    flagged: row.flagged,
    flagReason: row.flag_reason,
    summary: row.summary,
  });
}

const WINDOW_FETCH_CAP = 500;

const SELECT_COLS =
  "id, account_id, from_raw, subject, snippet, received_at, category, is_sent, flagged, flag_reason, summary";

/** MailPort Supabase — lit `mail_items` (RLS), fenêtre J-2 + veille + jour. */
export function createSupabaseMail(client: SupabaseClient): MailPort {
  async function listInWindow(
    limit: number,
    options: { flaggedOnly?: boolean; mailbox: MailboxFilter },
  ): Promise<MailSummary[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.min(Math.floor(limit), WINDOW_FETCH_CAP))
      : 0;
    if (safeLimit === 0) {
      return [];
    }

    let query = client
      .from("mail_items")
      .select(SELECT_COLS)
      .gte("received_at", startOfMailWindow().toISOString())
      .order("received_at", { ascending: false })
      .limit(safeLimit);

    // Éviter `.eq(..., false)` (certains clients omettent le filtre).
    query =
      options.mailbox === "sent"
        ? query.eq("is_sent", true)
        : query.not("is_sent", "eq", true);

    if (options.flaggedOnly) {
      query = query.eq("flagged", true);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    const rows = ((data ?? []) as MailItemRow[]).map(mapRow);
    // Filet client — UI = reçus uniquement.
    return options.mailbox === "sent"
      ? rows.filter((item) => item.isSent === true)
      : rows.filter((item) => item.isSent !== true);
  }

  async function listByLabelInMailbox(
    label: string,
    limit: number,
    mailbox: MailboxFilter,
  ): Promise<MailSummary[]> {
    const trimmed = label.trim();
    if (trimmed.length === 0) {
      return [];
    }
    const rows = await listInWindow(WINDOW_FETCH_CAP, { mailbox });
    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.min(Math.floor(limit), WINDOW_FETCH_CAP))
      : 0;
    if (safeLimit === 0) {
      return [];
    }
    return rows
      .filter((item) => mailMatchesLabel(item.category, trimmed))
      .slice(0, safeLimit);
  }

  return {
    async listRecent(limit) {
      return listInWindow(limit, { mailbox: "inbox" });
    },
    async listFlagged(limit) {
      return listInWindow(limit, { flaggedOnly: true, mailbox: "inbox" });
    },
    async listByLabel(label, limit) {
      return listByLabelInMailbox(label, limit, "inbox");
    },
    async listSentByLabel(label, limit) {
      return listByLabelInMailbox(label, limit, "sent");
    },
  };
}
