import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import {
  collectMailAccountIds,
  collectMailLabels,
  filterByAccount,
  filterFrom,
  filterSearch,
  filterToday,
  filterUnread,
  filterYesterday,
} from "@/features/assistant/model/filterMailItems";
import { formatMailSendersReply } from "@/features/assistant/model/formatMailSendersReply";
import { formatMailTitlesReply } from "@/features/assistant/model/formatMailTitlesReply";
import { t } from "@/lib/i18n";
import type { MailPort } from "@/ports/mail-port";

const WINDOW = 500;
const LIST = 50;

function toItems(
  items: Awaited<ReturnType<MailPort["listRecent"]>>,
): { from: string; subject: string }[] {
  return items.map((item) => ({ from: item.from, subject: item.subject }));
}

type MailV2Intent = Extract<
  AssistantIntent,
  {
    kind:
      | "mail.unread"
      | "mail.today"
      | "mail.yesterday"
      | "mail.count_unread"
      | "mail.count_flagged"
      | "mail.count_today"
      | "mail.labels"
      | "mail.accounts"
      | "mail.account"
      | "mail.unread_account"
      | "mail.from"
      | "mail.search";
  }
>;

export function isMailV2Intent(
  intent: AssistantIntent,
): intent is MailV2Intent {
  return (
    intent.kind === "mail.unread" ||
    intent.kind === "mail.today" ||
    intent.kind === "mail.yesterday" ||
    intent.kind === "mail.count_unread" ||
    intent.kind === "mail.count_flagged" ||
    intent.kind === "mail.count_today" ||
    intent.kind === "mail.labels" ||
    intent.kind === "mail.accounts" ||
    intent.kind === "mail.account" ||
    intent.kind === "mail.unread_account" ||
    intent.kind === "mail.from" ||
    intent.kind === "mail.search"
  );
}

/**
 * Filtres mail v2 — surface produit : compte / noms du jour.
 * Pas de lecture unitaire ni snippet dans les réponses.
 */
export async function executeMailV2Intent(
  intent: MailV2Intent,
  mail: MailPort,
): Promise<string> {
  const recent = await mail.listRecent(WINDOW);

  switch (intent.kind) {
    case "mail.unread": {
      const items = filterUnread(recent).slice(0, LIST);
      if (items.length === 0) {
        return t("assistant.mailUnreadEmpty");
      }
      return formatMailTitlesReply(
        t("assistant.mailUnreadLabel"),
        toItems(items),
      );
    }
    case "mail.today": {
      const items = filterToday(recent).slice(0, LIST);
      return formatMailSendersReply(items);
    }
    case "mail.yesterday": {
      const items = filterYesterday(recent).slice(0, LIST);
      if (items.length === 0) {
        return t("assistant.mailYesterdayEmpty");
      }
      return formatMailTitlesReply(
        t("assistant.mailYesterdayLabel"),
        toItems(items),
      );
    }
    case "mail.count_unread": {
      const count = filterUnread(recent).length;
      return count === 0
        ? t("assistant.mailCountUnreadEmpty")
        : t("assistant.mailCountUnread", { count });
    }
    case "mail.count_flagged": {
      const flagged = await mail.listFlagged(WINDOW);
      const count = flagged.length;
      return count === 0
        ? t("assistant.mailCountFlaggedEmpty")
        : t("assistant.mailCountFlagged", { count });
    }
    case "mail.count_today": {
      const count = filterToday(recent).length;
      return count === 0
        ? t("assistant.mailCountTodayEmpty")
        : t("assistant.mailCountToday", { count });
    }
    case "mail.labels": {
      const labels = collectMailLabels(recent);
      if (labels.length === 0) {
        return t("assistant.mailLabelsEmpty");
      }
      return t("assistant.mailLabelsList", { list: labels.join(", ") });
    }
    case "mail.accounts": {
      const accounts = collectMailAccountIds(recent);
      if (accounts.length === 0) {
        return t("assistant.mailAccountsEmpty");
      }
      return t("assistant.mailAccountsList", {
        count: accounts.length,
        list: accounts.join(", "),
      });
    }
    case "mail.account": {
      const items = filterByAccount(recent, intent.account).slice(0, LIST);
      if (items.length === 0) {
        return t("assistant.mailAccountEmpty", { account: intent.account });
      }
      return formatMailTitlesReply(intent.account, toItems(items));
    }
    case "mail.unread_account": {
      const items = filterUnread(filterByAccount(recent, intent.account)).slice(
        0,
        LIST,
      );
      if (items.length === 0) {
        return t("assistant.mailUnreadAccountEmpty", {
          account: intent.account,
        });
      }
      return formatMailTitlesReply(intent.account, toItems(items));
    }
    case "mail.from": {
      const items = filterFrom(recent, intent.text).slice(0, LIST);
      if (items.length === 0) {
        return t("assistant.mailFromEmpty", { text: intent.text });
      }
      return formatMailTitlesReply(intent.text, toItems(items));
    }
    case "mail.search": {
      const items = filterSearch(recent, intent.text).slice(0, LIST);
      if (items.length === 0) {
        return t("assistant.mailSearchEmpty", { text: intent.text });
      }
      return formatMailTitlesReply(
        t("assistant.mailSearchLabel", { text: intent.text }),
        toItems(items),
      );
    }
  }
}
