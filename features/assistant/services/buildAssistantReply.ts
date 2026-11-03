import "server-only";

import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import { buildIntentAssistantReply } from "@/features/assistant/services/buildIntentAssistantReply";
import {
  executeGithubIntent,
  isGithubIntent,
} from "@/features/assistant/services/executeGithubIntent";
import { createLogger } from "@/lib/logger";
import type { MailPort } from "@/ports/mail-port";

const log = createLogger("assistant.reply");

/**
 * Orchestration serveur — intents locaux (mail + github).
 */
export async function buildAssistantReply(
  text: string,
  mail: MailPort,
): Promise<string> {
  const intent = parseAssistantIntent(text);
  log.info("reply_start", {
    chars: text.length,
    intent: intent?.kind ?? null,
  });

  if (intent && isGithubIntent(intent)) {
    const reply = await executeGithubIntent(intent);
    log.info("reply_ok", { chars: reply.length, via: "github" });
    return reply;
  }

  const reply = await buildIntentAssistantReply(text, mail);
  log.info("reply_ok", { chars: reply.length, via: "intent" });
  return reply;
}
