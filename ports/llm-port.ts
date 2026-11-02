import type { ActionProposal } from "@/lib/schemas";

export type LlmChunk =
  | { type: "text"; text: string }
  | { type: "action-proposal"; proposal: ActionProposal }
  | { type: "done" };

export interface LlmPort {
  reply(input: { text: string }, signal: AbortSignal): AsyncIterable<LlmChunk>;
}
