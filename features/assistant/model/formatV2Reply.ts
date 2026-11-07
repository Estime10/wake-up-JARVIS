import { REPLIES_FR_V2 } from "@/features/assistant/model/intents/v2/replies.fr.v2";
import { t } from "@/lib/i18n";

function fillTemplate(
  template: string,
  slots: Readonly<Record<string, string>>,
): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (_full, key: string) => {
    return slots[key] ?? `{${key}}`;
  });
}

function brandElsa(text: string): string {
  return text
    .replace(/\bJARVIS\b/g, "E.L.S.A.")
    .replace(/\bJarvis\b/g, "E.L.S.A.");
}

/**
 * Gabarit FR v2 — variables de slots + rebrand E.L.S.A.
 */
export function formatV2LocalReply(
  id: string,
  slots: Readonly<Record<string, string>> = {},
): string {
  const entry = REPLIES_FR_V2[id];
  if (!entry) {
    return t("assistant.fallbackCapability");
  }

  const enriched: Record<string, string> = { ...slots };

  if (id === "time.now") {
    enriched.time = new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  }
  if (id === "time.date") {
    enriched.date = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  for (const [key, value] of Object.entries(enriched)) {
    if (!value.trim()) {
      const missing = entry.missing?.[key];
      if (missing) {
        return brandElsa(missing);
      }
    }
  }

  return brandElsa(fillTemplate(entry.ok, enriched));
}

export function formatV2StubReply(id: string): string {
  const entry = REPLIES_FR_V2[id];
  if (entry?.ok) {
    // Affiche le gabarit sans inventer de données — mieux qu’un silence.
    const preview = brandElsa(entry.ok).replace(/\{[a-zA-Z]+\}/g, "…");
    return `${preview}\n\n(${t("assistant.v2StubHint")})`;
  }
  return t("assistant.v2StubHint");
}
