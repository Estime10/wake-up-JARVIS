/**
 * Charge des extraits Gmail éphémères (jamais stockés côté client durablement).
 */
export async function fetchMailExcerpts(
  ids: readonly string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter((id) => id.trim().length > 0))];
  if (unique.length === 0) {
    return {};
  }

  const response = await fetch("/api/mail/excerpts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: unique.slice(0, 20) }),
  });

  if (!response.ok) {
    return {};
  }

  const json: unknown = await response.json().catch(() => null);
  if (
    !json ||
    typeof json !== "object" ||
    !("excerpts" in json) ||
    typeof (json as { excerpts: unknown }).excerpts !== "object" ||
    (json as { excerpts: unknown }).excerpts === null
  ) {
    return {};
  }

  const raw = (json as { excerpts: Record<string, unknown> }).excerpts;
  const excerpts: Record<string, string> = {};
  for (const [id, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim()) {
      excerpts[id] = value.trim();
    }
  }
  return excerpts;
}
