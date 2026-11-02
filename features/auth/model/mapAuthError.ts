import type { MessageKey } from "@/lib/i18n";

/**
 * Mappe les erreurs Auth Supabase vers des clés i18n.
 * Jamais de message provider brut dans l’UI.
 */
export function mapAuthError(message: string): MessageKey {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "auth.errorInvalidCredentials";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("user already registered")
  ) {
    return "auth.errorEmailTaken";
  }

  if (normalized.includes("password") && normalized.includes("weak")) {
    return "auth.errorWeakPassword";
  }

  if (
    normalized.includes("valid email") ||
    normalized.includes("invalid email")
  ) {
    return "auth.errorInvalidEmail";
  }

  if (normalized.includes("email not confirmed")) {
    return "auth.errorConfirmEmail";
  }

  return "auth.errorGeneric";
}
