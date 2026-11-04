import type { SupabaseClient } from "@supabase/supabase-js";

import { messageSchema, type Message } from "@/lib/schemas";
import type { ListMessagesQuery, MemoryPort } from "@/ports/memory-port";

type MessageRow = {
  id: string;
  role: "user" | "assistant";
  text: string;
  created_at: string;
};

function rowToMessage(row: MessageRow): Message {
  return messageSchema.parse({
    id: row.id,
    role: row.role,
    text: row.text,
    createdAt: row.created_at,
  });
}

/** Valeurs PostgREST avec `:` / caractères spéciaux. */
function quoteFilterValue(value: string): string {
  return `"${value.replaceAll('"', '\\"')}"`;
}

function olderThanFilter(createdAt: string, id: string): string {
  const at = quoteFilterValue(createdAt);
  const messageId = quoteFilterValue(id);
  return `created_at.lt.${at},and(created_at.eq.${at},id.lt.${messageId})`;
}

/**
 * MemoryPort → table `public.messages` (RLS par user_id).
 * Fil vide si pas de session / aucun message — plus de seed mock.
 */
export function createSupabaseMemory(client: SupabaseClient): MemoryPort {
  return {
    async listMessages(query?: ListMessagesQuery) {
      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        return [];
      }

      const limit = query?.limit;
      const before = query?.before;

      // Page bornée : fetch newest-first puis reverse → oldest → newest.
      if (limit !== undefined) {
        if (limit <= 0) {
          return [];
        }

        let request = client
          .from("messages")
          .select("id, role, text, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(limit);

        if (before) {
          request = request.or(olderThanFilter(before.createdAt, before.id));
        }

        const { data, error } = await request;

        if (error) {
          throw new Error(`MemoryPort.listMessages: ${error.message}`);
        }

        const rows = ((data ?? []) as MessageRow[]).reverse();
        return rows.map(rowToMessage);
      }

      let request = client
        .from("messages")
        .select("id, role, text, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      if (before) {
        request = request.or(olderThanFilter(before.createdAt, before.id));
      }

      const { data, error } = await request;

      if (error) {
        throw new Error(`MemoryPort.listMessages: ${error.message}`);
      }

      return ((data ?? []) as MessageRow[]).map(rowToMessage);
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
