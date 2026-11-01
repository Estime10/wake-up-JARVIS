import { fr } from "@/lib/i18n/messages/fr";
import type { MessageKey, MessageParams } from "@/lib/i18n/types";

function readPath(messages: typeof fr, key: MessageKey): string {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (typeof current !== "object" || current === null || !(part in current)) {
      throw new Error(`Missing i18n key: ${key}`);
    }
    current = (current as Record<string, unknown>)[part];
  }

  if (typeof current !== "string") {
    throw new Error(`i18n key is not a string: ${key}`);
  }

  return current;
}

function interpolate(template: string, params?: MessageParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = params[name];
    if (value === undefined) {
      throw new Error(
        `Missing i18n param "{${name}}" for template "${template}"`,
      );
    }
    return String(value);
  });
}

/**
 * Résout une clé de traduction FR.
 * Locale unique pour l'instant ; structure prête pour d'autres langues.
 */
export function t(key: MessageKey, params?: MessageParams): string {
  return interpolate(readPath(fr, key), params);
}
