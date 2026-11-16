import {
  nowPlayingApiResponseSchema,
  type NowPlayingSnapshot,
} from "@/features/music/model/nowPlayingSnapshot";

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

/** GET /api/music/now-playing → snapshot validé. */
export async function fetchNowPlayingSnapshot(
  signal?: AbortSignal,
): Promise<NowPlayingSnapshot | null> {
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
    if (!parsed.success) {
      return null;
    }
    return parsed.data.snapshot;
  } catch (error) {
    if (isAbortError(error)) {
      return null;
    }
    throw error;
  }
}
