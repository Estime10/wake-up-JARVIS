"use client";

import { useCallback, useEffect, useState } from "react";

import { mailAccountSchema, type MailAccount } from "@/lib/schemas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

export type MailAccountsStatus = "loading" | "ready" | "error" | "unavailable";

type UseMailAccountsResult = {
  accounts: MailAccount[];
  status: MailAccountsStatus;
  refresh: () => void;
  setEnabled: (accountId: string, enabled: boolean) => Promise<boolean>;
  disconnect: (accountId: string) => Promise<boolean>;
};

type Row = {
  id: string;
  email: string;
  label: string;
  status: string;
};

const SUPABASE_READY = hasSupabasePublicEnv();

/**
 * Liste des boîtes Gmail connectées (sans jeton).
 * Sans env Supabase : unavailable (pas de fixtures).
 */
export function useMailAccounts(): UseMailAccountsResult {
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [status, setStatus] = useState<MailAccountsStatus>(() =>
    SUPABASE_READY ? "loading" : "unavailable",
  );
  const [attempt, setAttempt] = useState(0);

  const refresh = useCallback(() => {
    if (!SUPABASE_READY) {
      return;
    }
    setStatus("loading");
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!SUPABASE_READY) {
      return;
    }

    let cancelled = false;
    const client = createSupabaseBrowserClient();

    void client
      .from("mail_accounts")
      .select("id, email, label, status")
      .order("connected_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) {
          return;
        }
        if (error) {
          setStatus("error");
          setAccounts([]);
          return;
        }
        const rows = (data ?? []) as Row[];
        setAccounts(
          rows.map((row) =>
            mailAccountSchema.parse({
              id: row.id,
              email: row.email,
              label: row.label,
              status: row.status,
            }),
          ),
        );
        setStatus("ready");
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const setEnabled = useCallback(
    async (accountId: string, enabled: boolean): Promise<boolean> => {
      const response = await fetch(`/api/mail/accounts/${accountId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: enabled ? "active" : "disabled",
        }),
      });
      if (!response.ok) {
        return false;
      }
      refresh();
      return true;
    },
    [refresh],
  );

  const disconnect = useCallback(
    async (accountId: string): Promise<boolean> => {
      const response = await fetch("/api/google/oauth/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (!response.ok) {
        return false;
      }
      refresh();
      return true;
    },
    [refresh],
  );

  return { accounts, status, refresh, setEnabled, disconnect };
}
