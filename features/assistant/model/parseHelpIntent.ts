import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { HELP_PATTERNS } from "@/features/assistant/model/intents/helpIntentCatalog";
import { matchIntentPatterns } from "@/features/assistant/model/matchIntentPatterns";

export function parseHelpIntent(
  text: string,
): Extract<AssistantIntent, { kind: "help" }> | null {
  if (matchIntentPatterns(text, HELP_PATTERNS)) {
    return { kind: "help" };
  }
  return null;
}
