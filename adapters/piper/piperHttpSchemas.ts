import { z } from "zod";

export const piperSynthesizeBodySchema = z.object({
  text: z.string().min(1).max(4096),
});

export type PiperSynthesizeBody = z.infer<typeof piperSynthesizeBodySchema>;

/** Corps brut max (octets) — refuse avant parse. */
export const PIPER_PROXY_MAX_BYTES = 4096;
