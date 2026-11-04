"use client";

import { ROUTES } from "@/lib/routes";

export type StudioStopResult =
  | { ok: true; alreadyStopped: boolean }
  | { ok: false; reason: "failed" | "disabled" };

/**
 * Ferme Studio côté stack locale (`supabase stop`).
 */
export async function stopSupabaseStudio(): Promise<StudioStopResult> {
  try {
    const response = await fetch(ROUTES.supabasePlatformStudioStop, {
      method: "POST",
      credentials: "same-origin",
    });
    const json = (await response.json()) as {
      ok?: boolean;
      alreadyStopped?: boolean;
      error?: string;
    };
    if (!response.ok || !json.ok) {
      return {
        ok: false,
        reason: json.error === "disabled" ? "disabled" : "failed",
      };
    }
    return {
      ok: true,
      alreadyStopped: Boolean(json.alreadyStopped),
    };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
