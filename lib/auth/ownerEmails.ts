import { z } from "zod";

const ownerEmailsSchema = z
  .string()
  .trim()
  .min(1)
  .transform((raw) =>
    raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 0),
  )
  .pipe(z.array(z.email()).min(1));

/**
 * Parse OWNER_EMAILS (CSV). Échec → liste vide (fail-closed côté requireOwner).
 */
export function parseOwnerEmails(
  raw: string | undefined = process.env.OWNER_EMAILS,
): readonly string[] {
  if (raw === undefined || raw.trim().length === 0) {
    return [];
  }
  const parsed = ownerEmailsSchema.safeParse(raw);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
}

export function isOwnerEmail(
  email: string | null | undefined,
  ownerEmails: readonly string[] = parseOwnerEmails(),
): boolean {
  if (!email) {
    return false;
  }
  return ownerEmails.includes(email.trim().toLowerCase());
}
