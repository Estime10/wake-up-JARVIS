import { z } from "zod";

export const musicTransportActionSchema = z.enum([
  "toggle",
  "next",
  "previous",
]);

export type MusicTransportAction = z.infer<typeof musicTransportActionSchema>;

export const musicTransportRequestSchema = z.object({
  action: musicTransportActionSchema,
});
