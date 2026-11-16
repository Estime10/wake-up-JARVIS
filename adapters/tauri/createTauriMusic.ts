import { invoke } from "@tauri-apps/api/core";
import { z } from "zod";

import type { MusicPort } from "@/ports/music-port";
import { nowPlayingSnapshotSchema } from "@/lib/music/nowPlayingSnapshot";

const transportResultSchema = z.object({
  accepted: z.boolean(),
  snapshot: nowPlayingSnapshotSchema,
});

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

/**
 * Music shell — probe + transport 100% locaux via Rust (ADR 0015).
 * Échec invoke → null (poll continue), jamais de throw silencieux mortel.
 */
export function createTauriMusic(): MusicPort {
  return {
    async getNowPlaying(signal) {
      if (signal?.aborted) {
        return null;
      }
      try {
        const raw: unknown = await invoke("music_now_playing");
        if (signal?.aborted) {
          return null;
        }
        const parsed = nowPlayingSnapshotSchema.safeParse(raw);
        return parsed.success ? parsed.data : null;
      } catch (error) {
        if (isAbortError(error)) {
          return null;
        }
        return null;
      }
    },

    async transport(action, signal) {
      if (signal?.aborted) {
        return null;
      }
      try {
        const raw: unknown = await invoke("music_transport", { action });
        if (signal?.aborted) {
          return null;
        }
        const parsed = transportResultSchema.safeParse(raw);
        if (!parsed.success) {
          return null;
        }
        return {
          accepted: parsed.data.accepted,
          snapshot: parsed.data.snapshot,
        };
      } catch (error) {
        if (isAbortError(error)) {
          return null;
        }
        return null;
      }
    },
  };
}
