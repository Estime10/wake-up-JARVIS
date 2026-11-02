import type { SupabaseClient } from "@supabase/supabase-js";

import { MOCK_SEED_MESSAGES } from "@/fixtures/messages";
import { messageSchema, type Message } from "@/lib/schemas";
import type { MemoryPort } from "@/ports/memory-port";

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  text: string;
  created_at: string;
};

/**
 * MemoryPort → table `public.messages` (RLS par user_id).
 * Sans session : seed local (comportement V0), pas d'écriture distante.
 */
export function createSupabaseMemory(client: SupabaseClient): MemoryPort {
  return {
    async listMessages() {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        return MOCK_SEED_MESSAGES.map((m) => messageSchema.parse(m));
      }

      const { data, error } = await client
        .from("messages")
        .select("id, role, text, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        throw new Error(`MemoryPort.listMessages: ${error.message}`);
      }

      const rows = (data ?? []) as MessageRow[];
      if (rows.length === 0) {
        return MOCK_SEED_MESSAGES.map((m) => messageSchema.parse(m));
      }

      return rows.map((row) =>
        messageSchema.parse({
          id: row.id,
          role: row.role,
          text: row.text,
          createdAt: row.created_at,
        }),
      );
    },

    async appendMessage(message: Message) {
      const parsed = messageSchema.parse(message);
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        // Pas encore connecté : la session UI garde le fil en mémoire locale.
        return;
      }

      const { error } = await client.from("messages").insert({
        id: parsed.id,
        user_id: user.id,
        role: parsed.role,
        text: parsed.text,
        created_at: parsed.createdAt,
      });

      if (error) {
        throw new Error(`MemoryPort.appendMessage: ${error.message}`);
      }
    },
  };
}
