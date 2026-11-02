/** Identité Auth exposée à l’UI — pas le User Supabase brut. */
export type AuthUser = {
  id: string;
  email: string | null;
};

export function toAuthUser(
  user: {
    id: string;
    email?: string | null;
  } | null,
): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}
