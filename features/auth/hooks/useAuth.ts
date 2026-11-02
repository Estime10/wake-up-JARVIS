"use client";

import { use } from "react";

import { AuthContext } from "@/features/auth/context/auth-context";

export function useAuth() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error("useAuth doit être utilisé sous AuthProvider");
  }
  return value;
}
