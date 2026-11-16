import { z } from "zod";

export const nowPlayingSourceSchema = z.enum([
  "deezer",
  "youtube",
  "spotify",
  "apple_music",
  "browser",
  "other",
  "none",
]);

export const nowPlayingSnapshotSchema = z.object({
  playing: z.boolean(),
  source: nowPlayingSourceSchema,
  title: z.string(),
  artist: z.string(),
  /** Nom process hôte (ex. Brave Browser) — utile pour le transport. */
  app: z.string(),
});

export type NowPlayingSnapshot = z.infer<typeof nowPlayingSnapshotSchema>;

export const nowPlayingApiResponseSchema = z.object({
  ok: z.literal(true),
  snapshot: nowPlayingSnapshotSchema,
});
