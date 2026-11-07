import "server-only";

import type { CustomPhraseRule } from "@/features/assistant/model/customPhraseRules";
import { collectMailAccountIds } from "@/features/assistant/model/filterMailItems";
import { formatV2LocalReply } from "@/features/assistant/model/formatV2Reply";
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
import { loadGithubConnectionToken } from "@/lib/github/connectionToken";
import { t } from "@/lib/i18n";
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

  if (intent?.kind === "system.status") {
    const recent = await mail.listRecent(20);
    const accounts = collectMailAccountIds(recent);
    const mailState =
      accounts.length > 0
        ? t("assistant.systemMailOk", { count: accounts.length })
        : t("assistant.systemMailOff");
    const gh = await loadGithubConnectionToken();
    const githubState = gh.ok
      ? t("assistant.systemGithubOk", { login: gh.login })
      : t("assistant.systemGithubOff");
    const reply = formatV2LocalReply("system.status", {
      mailState,
      githubState,
      macState: t("assistant.systemMacPending"),
    });
    log.info("reply_ok", { chars: reply.length, via: "system" });
    return reply;
  }

  const reply = await buildIntentAssistantReply(text, mail, customRules);
  log.info("reply_ok", { chars: reply.length, via: "intent" });
  return reply;
}
