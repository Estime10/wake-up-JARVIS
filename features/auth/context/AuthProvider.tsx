"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "@/features/auth/context/auth-context";
import type { AuthResult } from "@/features/auth/model/authResult";
import { toAuthUser, type AuthUser } from "@/features/auth/model/authUser";
import { mapAuthError } from "@/features/auth/model/mapAuthError";
import type { AuthCredentials } from "@/lib/schemas";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * Session Auth Supabase (email/password).
 * Sans env publique : reste anonyme — le gate home est désactivé côté serveur.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [client] = useState(() =>
    hasSupabasePublicEnv() ? createSupabaseBrowserClient() : null,
  );
  const [status, setStatus] = useState<AuthStatus>(() =>
    client ? "loading" : "anonymous",
  );
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!client) {
      return;
    }

    let cancelled = false;

    void client.auth.getUser().then(({ data }) => {
      if (cancelled) {
        return;
      }
      const next = toAuthUser(data.user);
      setUser(next);
      setStatus(next ? "authenticated" : "anonymous");
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const next = toAuthUser(session?.user ?? null);
      setUser(next);
      setStatus(next ? "authenticated" : "anonymous");
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [client]);

  const signIn = useCallback(
    async (credentials: AuthCredentials): Promise<AuthResult> => {
      if (!client) {
        return { ok: false, messageKey: "auth.errorMissingConfig" };
      }

      const { error } = await client.auth.signInWithPassword(credentials);
      if (error) {
        return { ok: false, messageKey: mapAuthError(error.message) };
      }

      return { ok: true };
    },
    [client],
  );

  const signUp = useCallback(
    async (credentials: AuthCredentials): Promise<AuthResult> => {
      if (!client) {
        return { ok: false, messageKey: "auth.errorMissingConfig" };
      }

      const { data, error } = await client.auth.signUp(credentials);
      if (error) {
        return { ok: false, messageKey: mapAuthError(error.message) };
      }

      if (!data.session) {
        return { ok: false, messageKey: "auth.errorConfirmEmail" };
      }

      return { ok: true };
    },
    [client],
  );

  const signOut = useCallback(async () => {
    if (!client) {
      return;
    }
    await client.auth.signOut();
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
