import "server-only";

import type { CustomPhraseRule } from "@/features/assistant/model/customPhraseRules";
import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import { buildIntentAssistantReply } from "@/features/assistant/services/buildIntentAssistantReply";
import {
  executeGithubIntent,
  isGithubIntent,
} from "@/features/assistant/services/executeGithubIntent";
import {
  executeSupabaseIntent,
  isSupabaseIntent,
} from "@/features/assistant/services/executeSupabaseIntent";
import { createLogger } from "@/lib/logger";
import type { MailPort } from "@/ports/mail-port";

const log = createLogger("assistant.reply");

/**
 * Orchestration serveur — intents locaux (mail + github + supabase).
 */
export async function buildAssistantReply(
  text: string,
  mail: MailPort,
  customRules?: readonly CustomPhraseRule[],
): Promise<string> {
  const intent = parseAssistantIntent(text, customRules ? { customRules } : {});
  log.info("reply_start", {
    chars: text.length,
    intent: intent?.kind ?? null,
  });

  if (intent && isGithubIntent(intent)) {
    const reply = await executeGithubIntent(intent);
    log.info("reply_ok", { chars: reply.length, via: "github" });
    return reply;
  }

  if (intent && isSupabaseIntent(intent)) {
    const reply = await executeSupabaseIntent(intent);
    log.info("reply_ok", { chars: reply.length, via: "supabase" });
    return reply;
  }

  const reply = await buildIntentAssistantReply(text, mail, customRules);
  log.info("reply_ok", { chars: reply.length, via: "intent" });
  return reply;
}
