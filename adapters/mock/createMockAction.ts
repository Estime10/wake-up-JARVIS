import { delay, isAbortError } from "@/adapters/mock/delay";
import { MOCK_JOURNAL } from "@/fixtures/journal";
import type { ActionEvent } from "@/lib/schemas";
import type { ActionPort } from "@/ports/action-port";

async function* runMockExecute(
  signal: AbortSignal,
): AsyncGenerator<ActionEvent, void, undefined> {
  const lines = [
    "total 32",
    "drwxr-xr-x  8 devinchat  staff   256 Nov  2 09:00 .",
    "drwxr-xr-x  5 devinchat  staff   160 Nov  1 18:22 ..",
    "-rw-r--r--  1 devinchat  staff  1125 Nov  2 08:29 README.md",
  ];
  for (const line of lines) {
    await delay(120, signal);
    yield { type: "stdout", line };
  }
  yield { type: "done", exitCode: 0 };
}

/** Mock actions — signature simulée, journal fixture. */
export function createMockAction(): ActionPort {
  const cancelled = new Set<string>();

  return {
    async requestSignature(_actionId, signal) {
      await delay(600, signal);
      // Toujours signé en mock ; UI de refus à l'étape carte d'action.
      return "signed";
    },

    async *execute(actionId, signal) {
      if (cancelled.has(actionId)) {
        yield { type: "stderr", line: "cancelled" };
        yield { type: "done", exitCode: 130 };
        return;
      }
      try {
        yield* runMockExecute(signal);
      } catch (error) {
        if (isAbortError(error)) {
          yield { type: "stderr", line: "aborted" };
          yield { type: "done", exitCode: 130 };
          return;
        }
        throw error;
      }
    },

    async cancel(actionId) {
      cancelled.add(actionId);
    },

    async history() {
      return [...MOCK_JOURNAL];
    },
  };
}
