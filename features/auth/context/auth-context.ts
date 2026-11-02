"use client";

import { createContext } from "react";

import type { AuthResult } from "@/features/auth/model/authResult";
import type { AuthUser } from "@/features/auth/model/authUser";
import type { AuthCredentials } from "@/lib/schemas";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  signIn: (credentials: AuthCredentials) => Promise<AuthResult>;
  signUp: (credentials: AuthCredentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
