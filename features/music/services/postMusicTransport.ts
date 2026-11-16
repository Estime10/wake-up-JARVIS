import {
  nowPlayingSnapshotSchema,
  type NowPlayingSnapshot,
} from "@/features/music/model/nowPlayingSnapshot";
import type { MusicTransportAction } from "@/lib/music/musicTransportAction";
import { z } from "zod";

const responseSchema = z.object({
  ok: z.literal(true),
  accepted: z.boolean(),
  snapshot: nowPlayingSnapshotSchema,
});

export type PostMusicTransportResult = {
  accepted: boolean;
  snapshot: NowPlayingSnapshot;
};

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

/** POST /api/music/transport → snapshot après action. */
export async function postMusicTransport(
  action: MusicTransportAction,
  signal?: AbortSignal,
): Promise<PostMusicTransportResult | null> {
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
    const parsed = responseSchema.safeParse(json);
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
}
