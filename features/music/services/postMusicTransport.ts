import { invoke } from "@tauri-apps/api/core";

import {
  nowPlayingSnapshotSchema,
  type NowPlayingSnapshot,
} from "@/features/music/model/nowPlayingSnapshot";
import { fetchNowPlayingSnapshot } from "@/features/music/services/fetchNowPlayingSnapshot";
import type { MusicTransportAction } from "@/lib/music/musicTransportAction";
import { isTauri } from "@/lib/runtime/isTauri";
import { z } from "zod";

const responseSchema = z.object({
  ok: z.literal(true),
  accepted: z.boolean(),
  snapshot: nowPlayingSnapshotSchema,
});

const tauriTransportSchema = z.object({
  accepted: z.boolean(),
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

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Shell Tauri : invoke Rust (média + Deezer), puis snapshot via API probe. */
async function postMusicTransportViaTauri(
  action: MusicTransportAction,
  signal?: AbortSignal,
): Promise<PostMusicTransportResult | null> {
  const before = await fetchNowPlayingSnapshot(signal);
  if (signal?.aborted) {
    return null;
  }

  const raw: unknown = await invoke("music_transport", { action });
  const parsed = tauriTransportSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.accepted) {
    return null;
  }

  await sleepMs(200);
  if (signal?.aborted) {
    return null;
  }

  const after = await fetchNowPlayingSnapshot(signal);
  if (!after) {
    return null;
  }

  if (action !== "toggle" || !before) {
    return { accepted: true, snapshot: after };
  }

  return {
    accepted: true,
    snapshot: {
      ...after,
      playing: !before.playing,
      title: after.title || before.title,
      artist: after.artist || before.artist,
      source: after.source !== "none" ? after.source : before.source,
      app: after.app || before.app,
    },
  };
}

/** POST /api/music/transport → snapshot après action (fallback web / hors shell). */
async function postMusicTransportViaApi(
  action: MusicTransportAction,
  signal?: AbortSignal,
): Promise<PostMusicTransportResult | null> {
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
}

/** Transport Now Playing — Tauri (Rust) prioritaire, API Next en fallback. */
export async function postMusicTransport(
  action: MusicTransportAction,
  signal?: AbortSignal,
): Promise<PostMusicTransportResult | null> {
  try {
    if (isTauri()) {
      return await postMusicTransportViaTauri(action, signal);
    }
    return await postMusicTransportViaApi(action, signal);
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }
    throw error;
  }
}
