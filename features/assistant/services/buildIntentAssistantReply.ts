import type { CustomPhraseRule } from "@/features/assistant/model/customPhraseRules";
import {
  collectMailAccountIds,
  filterToday,
} from "@/features/assistant/model/filterMailItems";
import { formatMailOverviewReply } from "@/features/assistant/model/formatMailOverviewReply";
import { formatMailSendersReply } from "@/features/assistant/model/formatMailSendersReply";
import { formatMailTitlesReply } from "@/features/assistant/model/formatMailTitlesReply";
import {
  formatV2LocalReply,
  formatV2StubReply,
} from "@/features/assistant/model/formatV2Reply";
import { parseAssistantIntent } from "@/features/assistant/model/parseAssistantIntent";
import {
  executeMailV2Intent,
  isMailV2Intent,
} from "@/features/assistant/services/executeMailV2Intent";
import { t } from "@/lib/i18n";
import { pickUserHonorific } from "@/lib/user/userHonorific";
import type { MailPort } from "@/ports/mail-port";

const MAIL_LIMIT = 50;
const RECENT_LIMIT = 100;

function toMailItems(
  items: Awaited<ReturnType<MailPort["listRecent"]>>,
): { from: string; subject: string }[] {
  return items.map((item) => ({ from: item.from, subject: item.subject }));
}

/**
 * Réponses mail + chat + fichiers + gabarits v2 (sans LLM).
 * GitHub / Supabase serveur : `buildAssistantReply`.
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
      return formatV2LocalReply("help");
    case "chat.greeting":
      return formatV2LocalReply("chat.greeting");
    case "chat.how_are_you":
      return formatV2LocalReply("chat.how_are_you");
    case "chat.thanks":
      return formatV2LocalReply("chat.thanks");
    case "refuse.write":
      return intent.topic
        ? formatV2LocalReply(intent.topic)
        : t("assistant.refuseWrite", { name: pickUserHonorific() });
    case "v2.local":
      return formatV2LocalReply(intent.id, intent.slots);
    case "v2.stub":
      return formatV2StubReply(intent.id);
    case "ui.phrase_catalog":
    case "ui.panel_mail":
    case "ui.close_panel":
    case "ui.repo_tab":
    case "ui.stop_speaking":
    case "ui.mute":
    case "ui.unmute":
    case "geo.where":
      // Side-effects + spokenReply côté client (applyAssistantUiIntent).
      return formatV2LocalReply(
        intent.kind === "ui.repo_tab"
          ? intent.tab === "pr"
            ? "ui.repo_tab_pr"
            : intent.tab === "commits"
              ? "ui.repo_tab_commits"
              : intent.tab === "files"
                ? "ui.repo_tab_files"
                : "ui.repo_tab_branches"
          : intent.kind,
        intent.kind === "ui.repo_tab" && intent.repoQuery
          ? { repo: intent.repoQuery }
          : {},
      );
    case "system.status": {
      const recent = await mail.listRecent(20);
      const accounts = collectMailAccountIds(recent);
      const mailState =
        accounts.length > 0
          ? t("assistant.systemMailOk", { count: accounts.length })
          : t("assistant.systemMailOff");
      return formatV2LocalReply("system.status", {
        mailState,
        githubState: t("assistant.systemGithubPending"),
        macState: t("assistant.systemMacPending"),
      });
    }
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
      const items = filterToday(await mail.listRecent(RECENT_LIMIT));
      return formatMailSendersReply(items);
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
    default: {
      if (isMailV2Intent(intent)) {
        return executeMailV2Intent(intent, mail);
      }
      return t("assistant.fallbackCapability");
    }
  }
}
