import type { MessageKey } from "@/lib/i18n/types";

export type AuthResult = { ok: true } | { ok: false; messageKey: MessageKey };
