import { isOwnerEmail, parseOwnerEmails } from "@/lib/auth/ownerEmails";

export type OwnerAccessOk = { ok: true };

export type OwnerAccessDenied = {
  ok: false;
  status: 401 | 403;
  error: "unauthorized" | "forbidden_owner";
};

export type OwnerAccessResult = OwnerAccessOk | OwnerAccessDenied;

export type OwnerAccessInput = {
  user: { id: string; email?: string | null } | null;
  ownerEmails?: readonly string[];
};

/**
 * Garde propriétaire (allowlist OWNER_EMAILS) — pure, testable sans Supabase.
 * Pas de MFA / aal2 (décision DevinChat).
 */
export function evaluateOwnerAccess(
  input: OwnerAccessInput,
): OwnerAccessResult {
  if (!input.user) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const ownerEmails = input.ownerEmails ?? parseOwnerEmails();
  if (!isOwnerEmail(input.user.email, ownerEmails)) {
    return { ok: false, status: 403, error: "forbidden_owner" };
  }

  return { ok: true };
}
