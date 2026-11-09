import { invoke } from "@tauri-apps/api/core";

export type StudioEnsureOk = {
  studioUrl: string;
  alreadyRunning: boolean;
  startedDocker: boolean;
};

/**
 * Docker + `supabase start` sur le Mac si besoin, puis URL Studio loopback.
 * Hors API Next/Vercel (shell Tauri).
 */
export async function ensureLocalStudioViaTauri(): Promise<StudioEnsureOk> {
  return invoke<StudioEnsureOk>("studio_ensure");
}
