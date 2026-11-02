import { z } from "zod";

import { mailAccountSchema, type MailAccount } from "@/lib/schemas";

/**
 * 3 boîtes Gmail mock (ADR 0010) — libellés courts sans `@gmail.com`.
 * Plus tard : `mail_accounts` + OAuth.
 */
export const MOCK_MAIL_ACCOUNTS: readonly MailAccount[] = z
  .array(mailAccountSchema)
  .parse([
    {
      id: "acc_estimevangu",
      email: "estimevangu@gmail.com",
      label: "estimevangu",
      status: "active",
    },
    {
      id: "acc_estimevangu_pro",
      email: "estimevangu.pro@gmail.com",
      label: "estimevangu.pro",
      status: "active",
    },
    {
      id: "acc_estimedev10",
      email: "estimedev10@gmail.com",
      label: "estimedev10",
      status: "active",
    },
  ]);
