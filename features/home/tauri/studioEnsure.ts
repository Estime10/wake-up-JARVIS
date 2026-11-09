import { invoke } from "@tauri-apps/api/core";

export type StudioEnsureOk = {
  studioUrl: string;
  alreadyRunning: boolean;
};

/**
 * Probe Studio sur le Mac (loopback) — hors API Next/Vercel.
 */
export async function ensureLocalStudioViaTauri(): Promise<StudioEnsureOk> {
  return invoke<StudioEnsureOk>("studio_ensure");
}
