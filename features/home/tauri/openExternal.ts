import { invoke } from "@tauri-apps/api/core";

import { isTauri } from "@/lib/runtime/isTauri";

/**
 * Ouvre une URL dans le navigateur système (shell Tauri) ou un onglet (web).
 */
export async function openExternalUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return;
  }

  if (isTauri()) {
    await invoke("open_external_url", { url: trimmed });
    return;
  }

  window.open(trimmed, "_blank", "noopener,noreferrer");
}
