import { z } from "zod";

import { journalEntrySchema, type JournalEntry } from "@/lib/schemas";

/** Journal factice — ActionPort.history(). */
export const MOCK_JOURNAL: readonly JournalEntry[] = z
  .array(journalEntrySchema)
  .parse([
    {
      id: "journal_01",
      actionId: "action_read_ls",
      command: "ls -la /Users/devinchat/code",
      status: "succeeded",
      startedAt: "2026-11-01T18:02:00.000Z",
      durationMs: 420,
      exitCode: 0,
      output: "total 32\nREADME.md\npackage.json\n",
    },
    {
      id: "journal_02",
      actionId: "action_mod_pull",
      command: "git -C /Users/devinchat/code/demo pull",
      status: "failed",
      startedAt: "2026-11-01T19:15:00.000Z",
      durationMs: 2100,
      exitCode: 1,
      output: "error: cannot pull with rebase: You have unstaged changes.",
    },
    {
      id: "journal_03",
      actionId: "action_read_status",
      command: "git -C /Users/devinchat/code/demo status -sb",
      status: "cancelled",
      startedAt: "2026-11-01T20:01:00.000Z",
      durationMs: 80,
    },
  ]);
