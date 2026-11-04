import { delay, isAbortError } from "@/adapters/mock/delay";
import { MOCK_ASSISTANT_REPLY } from "@/fixtures/assistantReply";
import { actionProposalSchema, type ActionProposal } from "@/lib/schemas";
import type { LlmChunk, LlmPort } from "@/ports/llm-port";

const CHUNK_SIZE = 12;
const CHUNK_MS = 28;
const THINK_MS = 400;
const SLOW_THINK_MS = 5000;

function expiresInSeconds(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

function proposalForTrigger(text: string): ActionProposal | null {
  const base = {
    cwd: "/Users/devinchat/code/demo",
    machine: { id: "mac-studio-1", name: "Mac Studio" },
    expiresAt: expiresInSeconds(120),
  };

  if (text.includes("#risque")) {
    return actionProposalSchema.parse({
      ...base,
      id: "action_risk_rm",
      command: "rm -rf /Users/devinchat/code/demo/build",
      explanation: "Supprime le dossier de build du dépôt demo.",
      risk: 3,
    });
  }
  if (text.includes("#modif")) {
    return actionProposalSchema.parse({
      ...base,
      id: "action_mod_pull",
      command: "git -C /Users/devinchat/code/demo pull",
      explanation: "Récupère les derniers commits du dépôt demo.",
      risk: 2,
    });
  }
  if (text.includes("#action")) {
    return actionProposalSchema.parse({
      ...base,
      id: "action_read_ls",
      command: "ls -la /Users/devinchat/code",
      explanation: "Liste le contenu du dossier code.",
      risk: 1,
    });
  }
  return null;
}

async function* streamText(
  full: string,
  signal: AbortSignal,
): AsyncGenerator<LlmChunk, void, undefined> {
  for (let i = 0; i < full.length; i += CHUNK_SIZE) {
    await delay(CHUNK_MS, signal);
    yield { type: "text", text: full.slice(i, i + CHUNK_SIZE) };
  }
}

/** Mock LLM — déclencheurs `#action` / `#modif` / `#risque` / `#erreur` / `#lent`. */
export function createMockLlm(): LlmPort {
  return {
    async *reply(input, signal): AsyncIterable<LlmChunk> {
      try {
        const thinkMs = input.text.includes("#lent") ? SLOW_THINK_MS : THINK_MS;
        await delay(thinkMs, signal);

        if (input.text.includes("#erreur")) {
          throw new Error("Mock LLM: déclencheur #erreur");
        }

        const proposal = proposalForTrigger(input.text);
        if (proposal) {
          yield {
            type: "text",
            text: "Action proposée — confirmation requise avant exécution.",
          };
          yield { type: "action-proposal", proposal };
          yield { type: "done" };
          return;
        }

        yield* streamText(MOCK_ASSISTANT_REPLY, signal);
        yield { type: "done" };
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }
        throw error;
      }
    },
  };
}
