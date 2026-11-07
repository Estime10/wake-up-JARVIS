import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { INTENTS_V2 } from "@/features/assistant/model/intents/v2/index.v2";
import type { RouteV2 } from "@/features/assistant/model/intents/v2/routeIntentV2";

const INTENT_BY_ID = new Map(INTENTS_V2.map((intent) => [intent.id, intent]));

/** Intents UI / ports pas encore branchés → réponse stub honnête. */
const STUB_IDS = new Set([
  "ui.panel_mail",
  "ui.repo_tab_pr",
  "ui.repo_tab_commits",
  "ui.repo_tab_files",
  "ui.repo_tab_branches",
  "ui.close_panel",
  "ui.stop_speaking",
  "ui.mute",
  "ui.unmute",
  "mail.attachments",
  "mail.summary",
  "github.issues",
  "github.issue_detail",
  "github.pr_detail",
  "github.files",
  "github.file_preview",
  "github.activity",
  "github.repo_info",
  "github.prs_closed",
  "github.commit_last",
  "files.recent",
  "geo.where",
  "system.status",
  "mail.unread",
  "mail.today",
  "mail.yesterday",
  "mail.count_unread",
  "mail.count_flagged",
  "mail.count_today",
  "mail.labels",
  "mail.accounts",
  "mail.account",
  "mail.unread_account",
  "mail.from",
  "mail.search",
  "mail.read",
  "conv.cancel",
  "conv.repeat",
  "conv.confirm",
  "conv.deny",
  "conv.correct",
  "conv.more",
  "conv.select",
  "conv.compound",
]);

function slot(
  slots: Readonly<Record<string, string>>,
  key: string,
): string | undefined {
  const value = slots[key]?.trim();
  return value && value.length > 0 ? value : undefined;
}

/**
 * Route v2 → AssistantIntent (handlers existants + local/stub).
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
    return { kind: "v2.local", id, slots: { ...slots } };
  }

  if (id === "files.reveal_file") {
    const file = slot(slots, "file");
    return file
      ? { kind: "files.open", query: file, revealInFinder: true }
      : { kind: "files.open", revealInFinder: true };
  }

  if (id === "files.open") {
    const file = slot(slots, "file");
    // « ouvre le premier / dernier » → ouverture générique (pas un nom de fichier).
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
