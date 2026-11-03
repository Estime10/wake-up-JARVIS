import type { PiperTransport } from "@/adapters/piper/types";
import { ROUTES } from "@/lib/routes";

/**
 * Transport navigateur → proxy Next `/api/voice/piper` (same-origin).
 */
export function createPiperHttpTransport(
  synthesizePath: string = ROUTES.voicePiper,
): PiperTransport {
  return {
    async synthesize(text, signal) {
      const response = await fetch(synthesizePath, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal,
      });
      if (!response.ok) {
        throw new Error(`piper_http_${response.status}`);
      }
      return response.arrayBuffer();
    },
  };
}
