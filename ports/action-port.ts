import type { ActionEvent, JournalEntry } from "@/lib/schemas";

export interface ActionPort {
  requestSignature(
    actionId: string,
    signal: AbortSignal,
  ): Promise<"signed" | "refused">;

  execute(actionId: string, signal: AbortSignal): AsyncIterable<ActionEvent>;

  cancel(actionId: string): Promise<void>;

  history(): Promise<JournalEntry[]>;
}
