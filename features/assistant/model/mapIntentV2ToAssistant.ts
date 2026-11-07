import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { INTENTS_V2 } from "@/features/assistant/model/intents/v2/index.v2";
import type { RouteV2 } from "@/features/assistant/model/intents/v2/routeIntentV2";
import type { RepoTab } from "@/features/home/model/repoTab";

const INTENT_BY_ID = new Map(INTENTS_V2.map((intent) => [intent.id, intent]));

/** Encore sans port / API (issues, pièces jointes, fichiers récents Mac…). */
const STUB_IDS = new Set([
  "mail.attachments",
  "github.issues",
  "github.issue_detail",
  "files.recent",
]);

function slot(
  slots: Readonly<Record<string, string>>,
  key: string,
): string | undefined {
  const value = slots[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function parseN(slots: Readonly<Record<string, string>>): number | null {
  const raw = slot(slots, "n");
  if (!raw) {
    return null;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Route v2 → AssistantIntent (handlers existants + filtres / UI branchés).
 */
export function mapIntentV2ToAssistant(route: RouteV2): AssistantIntent | null {
  if (route.kind !== "match") {
    return null;
  }

  const id = route.id;
  const slots = route.slots;
  const meta = INTENT_BY_ID.get(id);

  if (id.startsWith("refuse.")) {
    return { kind: "refuse.write", topic: id };
  }

  if (id === "ui.panel_repos") {
    const repo = slot(slots, "repo");
    return repo
      ? { kind: "github.open_repo", repoQuery: repo }
      : { kind: "github.open_panel" };
  }

  if (id === "ui.phrase_catalog") {
    return { kind: "ui.phrase_catalog" };
  }
  if (id === "ui.panel_mail") {
    return { kind: "ui.panel_mail" };
  }
  if (id === "ui.close_panel") {
    return { kind: "ui.close_panel" };
  }
  if (id === "ui.stop_speaking") {
    return { kind: "ui.stop_speaking" };
  }
  if (id === "ui.mute") {
    return { kind: "ui.mute" };
  }
  if (id === "ui.unmute") {
    return { kind: "ui.unmute" };
  }

  const tabMap: Record<string, RepoTab> = {
    "ui.repo_tab_pr": "pr",
    "ui.repo_tab_commits": "commits",
    "ui.repo_tab_files": "files",
    "ui.repo_tab_branches": "branches",
  };
  if (id in tabMap) {
    const tab = tabMap[id]!;
    const repo = slot(slots, "repo");
    return repo
      ? { kind: "ui.repo_tab", tab, repoQuery: repo }
      : { kind: "ui.repo_tab", tab };
  }

  if (id === "system.status") {
    return { kind: "system.status" };
  }
  if (id === "geo.where") {
    return { kind: "geo.where" };
  }

  if (id === "files.reveal_file") {
    const file = slot(slots, "file");
    return file
      ? { kind: "files.open", query: file, revealInFinder: true }
      : { kind: "files.open", revealInFinder: true };
  }

  if (id === "files.open") {
    const file = slot(slots, "file");
    if (file && /^(premier|premiere|dernier|derniere|1er|1ere)$/i.test(file)) {
      return { kind: "files.open" };
    }
  }

  if (id === "files.list" || id === "files.reveal_folder") {
    const folder = slot(slots, "folder");
    return folder ? { kind: "files.goto", folder } : null;
  }

  if (id === "mail.count_label") {
    const label = slot(slots, "label");
    return label ? { kind: "mail.count", label } : { kind: "mail.count" };
  }

  if (id === "mail.unread") {
    return { kind: "mail.unread" };
  }
  if (id === "mail.today") {
    return { kind: "mail.today" };
  }
  if (id === "mail.yesterday") {
    return { kind: "mail.yesterday" };
  }
  if (id === "mail.count_unread") {
    return { kind: "mail.count_unread" };
  }
  if (id === "mail.count_flagged") {
    return { kind: "mail.count_flagged" };
  }
  if (id === "mail.count_today") {
    return { kind: "mail.count_today" };
  }
  if (id === "mail.labels") {
    return { kind: "mail.labels" };
  }
  if (id === "mail.accounts") {
    return { kind: "mail.accounts" };
  }
  if (id === "mail.account") {
    const account = slot(slots, "account");
    return account ? { kind: "mail.account", account } : null;
  }
  if (id === "mail.unread_account") {
    const account = slot(slots, "account");
    return account ? { kind: "mail.unread_account", account } : null;
  }
  if (id === "mail.from") {
    const text = slot(slots, "text");
    return text ? { kind: "mail.from", text } : null;
  }
  if (id === "mail.search") {
    const text = slot(slots, "text");
    return text ? { kind: "mail.search", text } : null;
  }

  if (id === "github.prs_closed") {
    const repo = slot(slots, "repo");
    return repo
      ? { kind: "github.prs_closed", repoQuery: repo }
      : { kind: "github.prs_closed" };
  }
  if (id === "github.commit_last") {
    const repo = slot(slots, "repo");
    return repo
      ? { kind: "github.commit_last", repoQuery: repo }
      : { kind: "github.commit_last" };
  }
  if (id === "github.files") {
    const repo = slot(slots, "repo");
    return repo ? { kind: "github.files", repoQuery: repo } : null;
  }
  if (id === "github.file_preview") {
    const repo = slot(slots, "repo");
    const file = slot(slots, "file");
    return repo && file
      ? { kind: "github.file_preview", repoQuery: repo, file }
      : null;
  }
  if (id === "github.repo_info") {
    const repo = slot(slots, "repo");
    return repo ? { kind: "github.repo_info", repoQuery: repo } : null;
  }
  if (id === "github.activity") {
    return { kind: "github.activity" };
  }
  if (id === "github.pr_detail") {
    const repo = slot(slots, "repo");
    const n = parseN(slots);
    return repo && n ? { kind: "github.pr_detail", repoQuery: repo, n } : null;
  }

  const appKind = meta?.appKind ?? null;
  if (appKind) {
    switch (appKind) {
      case "help":
        return { kind: "help" };
      case "chat.greeting":
        return { kind: "chat.greeting" };
      case "chat.how_are_you":
        return { kind: "chat.how_are_you" };
      case "chat.thanks":
        return { kind: "chat.thanks" };
      case "refuse.write":
        return { kind: "refuse.write", topic: id };
      case "mail.list_recent":
        return { kind: "mail.list_recent" };
      case "mail.overview":
        return { kind: "mail.overview" };
      case "mail.count": {
        const label = slot(slots, "label");
        return label ? { kind: "mail.count", label } : { kind: "mail.count" };
      }
      case "mail.list_by_label": {
        const label = slot(slots, "label");
        return label ? { kind: "mail.list_by_label", label } : null;
      }
      case "mail.list_sent":
        return { kind: "mail.list_sent" };
      case "mail.list_sent_by_label": {
        const label = slot(slots, "label");
        return label ? { kind: "mail.list_sent_by_label", label } : null;
      }
      case "mail.list_flagged":
        return { kind: "mail.list_flagged" };
      case "github.status":
        return { kind: "github.status" };
      case "github.list_repos":
        return { kind: "github.list_repos" };
      case "github.list_pulls": {
        const repo = slot(slots, "repo");
        return repo
          ? { kind: "github.list_pulls", repoQuery: repo }
          : { kind: "github.list_pulls" };
      }
      case "github.list_commits": {
        const repo = slot(slots, "repo");
        return repo
          ? { kind: "github.list_commits", repoQuery: repo }
          : { kind: "github.list_commits" };
      }
      case "github.list_branches": {
        const repo = slot(slots, "repo");
        return repo
          ? { kind: "github.list_branches", repoQuery: repo }
          : { kind: "github.list_branches" };
      }
      case "files.goto": {
        const folder = slot(slots, "folder");
        return folder ? { kind: "files.goto", folder } : null;
      }
      case "files.find": {
        const file = slot(slots, "file");
        if (!file) {
          return null;
        }
        const folder = slot(slots, "folder");
        return folder
          ? { kind: "files.find", query: file, folder }
          : { kind: "files.find", query: file };
      }
      case "files.open": {
        const file = slot(slots, "file");
        // Filet : « ouvre {file} » ne doit pas voler l’ouverture des mails.
        if (
          file &&
          /^(?:mails?|boites? mail|boîtes? mail|messagerie)$/iu.test(file)
        ) {
          return { kind: "ui.panel_mail" };
        }
        return file
          ? { kind: "files.open", query: file }
          : { kind: "files.open" };
      }
      case "terminal.open": {
        const folder = slot(slots, "folder");
        return folder
          ? { kind: "terminal.open", folder }
          : { kind: "terminal.open" };
      }
      default:
        break;
    }
  }

  if (STUB_IDS.has(id)) {
    return { kind: "v2.stub", id, slots: { ...slots } };
  }

  return { kind: "v2.local", id, slots: { ...slots } };
}
