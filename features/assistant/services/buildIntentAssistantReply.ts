import type { CustomPhraseRule } from "@/features/assistant/model/customPhraseRules";
import { formatMailOverviewReply } from "@/features/assistant/model/formatMailOverviewReply";
import { formatMailTitlesReply } from "@/features/assistant/model/formatMailTitlesReply";
import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import { t } from "@/lib/i18n";
import type { MailPort } from "@/ports/mail-port";

const MAIL_LIMIT = 50;
const RECENT_LIMIT = 20;

function toMailItems(
  items: Awaited<ReturnType<MailPort["listRecent"]>>,
): { from: string; subject: string }[] {
  return items.map((item) => ({ from: item.from, subject: item.subject }));
}

/**
 * Réponses mail + chat + fichiers (sans LLM).
 * GitHub est exécuté côté serveur dans `buildAssistantReply`.
 */
export async function buildIntentAssistantReply(
  text: string,
  mail: MailPort,
  customRules?: readonly CustomPhraseRule[],
): Promise<string> {
  const intent = parseAssistantIntent(text, customRules ? { customRules } : {});

  if (!intent) {
    return t("assistant.fallbackCapability");
  }

  switch (intent.kind) {
    case "help":
      return t("assistant.help");
    case "chat.greeting":
      return t("assistant.chatGreeting");
    case "chat.how_are_you":
      return t("assistant.chatHowAreYou");
    case "chat.thanks":
      return t("assistant.chatThanks");
    case "refuse.write":
      return t("assistant.refuseWrite");
    case "terminal.open":
      return intent.folder
        ? t("assistant.terminalOpenFolder", { folder: intent.folder })
        : t("assistant.terminalOpen");
    case "github.open_panel":
      return t("assistant.githubOpenPanel");
    case "github.open_repo":
      return t("assistant.githubOpenRepo", { repo: intent.repoQuery });
    case "supabase.list_projects":
    case "supabase.studio":
      return t("assistant.supabaseNotConnected");
    case "supabase.studio_stop":
      return t("assistant.supabaseStudioStopped");
    case "files.goto":
      return t("assistant.filesGoto", { folder: intent.folder });
    case "files.find":
      return intent.folder
        ? t("assistant.filesFindIn", {
            file: intent.query,
            folder: intent.folder,
          })
        : t("assistant.filesFind", { file: intent.query });
    case "files.open": {
      if (intent.revealInFinder) {
        return intent.query
          ? t("assistant.filesReveal", { file: intent.query })
          : t("assistant.filesRevealGeneric");
      }
      return intent.query
        ? t("assistant.filesOpen", { file: intent.query })
        : t("assistant.filesOpenGeneric");
    }
    case "github.status":
    case "github.list_repos":
    case "github.list_pulls":
    case "github.list_commits":
    case "github.list_branches":
      return t("assistant.githubNeedsLive");
    case "mail.list_flagged": {
      const items = await mail.listFlagged(MAIL_LIMIT);
      return formatMailTitlesReply(
        t("assistant.mailFlaggedLabel"),
        toMailItems(items),
      );
    }
    case "mail.list_recent": {
      const items = await mail.listRecent(RECENT_LIMIT);
      return formatMailTitlesReply(
        t("assistant.mailRecentLabel"),
        toMailItems(items),
      );
    }
    case "mail.list_sent": {
      const items = await mail.listSent(MAIL_LIMIT);
      return formatMailTitlesReply(
        t("assistant.mailSentLabel"),
        toMailItems(items),
      );
    }
    case "mail.count": {
      if (intent.label) {
        const items = await mail.listByLabel(intent.label, 500);
        return t("assistant.mailCountLabel", {
          count: items.length,
          label: intent.label,
        });
      }
      const items = await mail.listRecent(500);
      return t("assistant.mailCount", { count: items.length });
    }
    case "mail.overview": {
      const items = await mail.listRecent(500);
      const counts = new Map<string, number>();
      for (const item of items) {
        const label = item.category?.trim() || t("assistant.mailUnlabeled");
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      const buckets = [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
      return formatMailOverviewReply(buckets, items.length);
    }
    case "mail.list_sent_by_label": {
      const items = await mail.listSentByLabel(intent.label, MAIL_LIMIT);
      return formatMailTitlesReply(intent.label, toMailItems(items));
    }
    case "mail.list_by_label": {
      const items = await mail.listByLabel(intent.label, MAIL_LIMIT);
      return formatMailTitlesReply(intent.label, toMailItems(items));
    }
  }
}
