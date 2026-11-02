import type { MailPort } from "@/ports/mail-port";

/**
 * Adapter mock minimal — pas de fixtures mails (données = Gmail live).
 * Sert uniquement quand Supabase n’est pas configuré.
 */
export function createMockMail(): MailPort {
  return {
    async listRecent() {
      return [];
    },
    async listFlagged() {
      return [];
    },
  };
}
