import { z } from "zod";

import { MOCK_ASSISTANT_GREETING } from "@/fixtures/assistantReply";
import { messageSchema, type Message } from "@/lib/schemas";

/** Seed conversation — validé Zod à l'import. */
export const MOCK_SEED_MESSAGES: readonly Message[] = z
  .array(messageSchema)
  .parse([
    {
      id: "seed-greeting",
      role: "assistant",
      text: MOCK_ASSISTANT_GREETING,
      createdAt: "2026-11-02T08:00:00.000Z",
    },
  ]);
