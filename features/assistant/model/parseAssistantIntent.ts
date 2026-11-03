import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { parseGithubIntents } from "@/features/assistant/model/parseGithubIntents";
import { parseHelpIntent } from "@/features/assistant/model/parseHelpIntent";
import { parseMailIntents } from "@/features/assistant/model/parseMailIntents";

/**
 * Routeur d’intents — priorité : help → github → mail.
 */
export function parseAssistantIntent(text: string): AssistantIntent | null {
  return (
    parseHelpIntent(text) ?? parseGithubIntents(text) ?? parseMailIntents(text)
  );
}
