import type { MusicPort } from "@/ports/music-port";
import {
  nowPlayingApiResponseSchema,
  nowPlayingSnapshotSchema,
} from "@/lib/music/nowPlayingSnapshot";
import { z } from "zod";

const transportResponseSchema = z.object({
  ok: z.literal(true),
  accepted: z.boolean(),
  snapshot: nowPlayingSnapshotSchema,
});

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

/** Music via API Next — fallback web / hors shell (probe serveur darwin). */
export function createHttpMusic(): MusicPort {
  return {
    async getNowPlaying(signal) {
      try {
        const response = await fetch("/api/music/now-playing", {
          method: "GET",
          cache: "no-store",
          ...(signal ? { signal } : {}),
        });
        if (!response.ok) {
          return null;
        }
        const json: unknown = await response.json();
        const parsed = nowPlayingApiResponseSchema.safeParse(json);
        return parsed.success ? parsed.data.snapshot : null;
      } catch (error) {
        if (isAbortError(error)) {
          return null;
        }
        throw error;
      }
    },

    async transport(action, signal) {
      try {
        const response = await fetch("/api/music/transport", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action }),
          cache: "no-store",
          ...(signal ? { signal } : {}),
        });
        if (!response.ok) {
          return null;
        }
        const json: unknown = await response.json();
        const parsed = transportResponseSchema.safeParse(json);
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
        throw error;
      }
    },
  };
}
