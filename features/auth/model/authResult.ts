import type { MessageKey } from "@/lib/i18n";

export type AuthResult = { ok: true } | { ok: false; messageKey: MessageKey };
