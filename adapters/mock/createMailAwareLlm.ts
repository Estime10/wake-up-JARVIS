import { isAbortError } from "@/adapters/mock/delay";
import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import { buildIntentAssistantReply } from "@/features/assistant/services/buildIntentAssistantReply";
import type { LlmChunk, LlmPort } from "@/ports/llm-port";
import type { MailPort } from "@/ports/mail-port";

const CHUNK_SIZE = 12;

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
 * Décorateur mock — intercepte les intents mail, sinon délègue au LLM mock.
 */
export function createMailAwareLlm(mail: MailPort, fallback: LlmPort): LlmPort {
  return {
    async *reply(input, signal): AsyncIterable<LlmChunk> {
      try {
        if (parseAssistantIntent(input.text)) {
          const reply = await buildIntentAssistantReply(input.text, mail);
          yield* streamText(reply, signal);
          if (!signal.aborted) {
            yield { type: "done" };
          }
          return;
        }
        yield* fallback.reply(input, signal);
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        throw error;
      }
    },
  };
}
