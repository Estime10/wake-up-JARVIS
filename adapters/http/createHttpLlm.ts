import { ROUTES } from "@/lib/routes";
import type { LlmChunk, LlmPort } from "@/ports/llm-port";

const CHUNK_SIZE = 24;

async function* streamText(
  full: string,
  signal: AbortSignal,
): AsyncGenerator<LlmChunk, void, undefined> {
  for (let i = 0; i < full.length; i += CHUNK_SIZE) {
    if (signal.aborted) {
      return;
    }
    yield { type: "text", text: full.slice(i, i + CHUNK_SIZE) };
  }
}

/**
 * LlmPort navigateur → `POST /api/assistant/reply` (intent mails côté serveur).
 */
export function createHttpLlm(): LlmPort {
  return {
    async *reply(input, signal): AsyncIterable<LlmChunk> {
      if (signal.aborted) {
        return;
      }

      const response = await fetch(ROUTES.assistantReply, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input.text }),
        signal,
      });

      if (!response.ok) {
        throw new Error("assistant_reply_failed");
      }

      const json = (await response.json()) as {
        ok?: boolean;
        reply?: unknown;
      };
      if (!json.ok || typeof json.reply !== "string") {
        throw new Error("assistant_reply_failed");
      }

      yield* streamText(json.reply, signal);
      if (!signal.aborted) {
        yield { type: "done" };
      }
    },
  };
}
