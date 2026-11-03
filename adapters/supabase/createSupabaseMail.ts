import type { SupabaseClient } from "@supabase/supabase-js";

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
  flagged: boolean;
  flag_reason: string | null;
  summary: string | null;
};

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
    flagged: row.flagged,
    flagReason: row.flag_reason,
    summary: row.summary,
  });
}

const WINDOW_FETCH_CAP = 500;

/** MailPort Supabase — lit `mail_items` (RLS), fenêtre J-2 + veille + jour. */
export function createSupabaseMail(client: SupabaseClient): MailPort {
  async function listInWindow(
    limit: number,
    flaggedOnly: boolean,
  ): Promise<MailSummary[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(0, Math.min(Math.floor(limit), WINDOW_FETCH_CAP))
      : 0;
    if (safeLimit === 0) {
      return [];
    }

    let query = client
      .from("mail_items")
      .select(
        "id, account_id, from_raw, subject, snippet, received_at, category, flagged, flag_reason, summary",
      )
      .gte("received_at", startOfMailWindow().toISOString())
      .order("received_at", { ascending: false })
      .limit(safeLimit);

    if (flaggedOnly) {
      query = query.eq("flagged", true);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }
    return ((data ?? []) as MailItemRow[]).map(mapRow);
  }

  return {
    async listRecent(limit) {
      return listInWindow(limit, false);
    },
    async listFlagged(limit) {
      return listInWindow(limit, true);
    },
  };
}
