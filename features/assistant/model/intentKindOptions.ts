import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import type { MessageKey } from "@/lib/i18n/types";

/** Kinds proposés au catalogue / phrases perso (hors v2.local / v2.stub). */
export type IntentKind = Exclude<
  AssistantIntent["kind"],
  "v2.local" | "v2.stub"
>;

export type IntentKindOption = {
  kind: IntentKind;
  labelKey: MessageKey;
  /** Champs optionnels à saisir pour cette signification. */
  fields: readonly ("label" | "repoQuery" | "folder" | "query")[];
};

/** Significations proposées dans le formulaire « ajouter une phrase ». */
export const INTENT_KIND_OPTIONS: readonly IntentKindOption[] = [
  { kind: "help", labelKey: "assistant.kindHelp", fields: [] },
  { kind: "chat.greeting", labelKey: "assistant.kindGreeting", fields: [] },
  {
    kind: "chat.how_are_you",
    labelKey: "assistant.kindHowAreYou",
    fields: [],
  },
  { kind: "chat.thanks", labelKey: "assistant.kindThanks", fields: [] },
  {
    kind: "mail.list_recent",
    labelKey: "assistant.kindMailRecent",
    fields: [],
  },
  { kind: "mail.overview", labelKey: "assistant.kindMailOverview", fields: [] },
  {
    kind: "mail.count",
    labelKey: "assistant.kindMailCount",
    fields: ["label"],
  },
  {
    kind: "mail.list_by_label",
    labelKey: "assistant.kindMailLabel",
    fields: ["label"],
  },
  { kind: "mail.list_sent", labelKey: "assistant.kindMailSent", fields: [] },
  {
    kind: "mail.list_sent_by_label",
    labelKey: "assistant.kindMailSentLabel",
    fields: ["label"],
  },
  {
    kind: "mail.list_flagged",
    labelKey: "assistant.kindMailFlagged",
    fields: [],
  },
  { kind: "github.status", labelKey: "assistant.kindGithubStatus", fields: [] },
  {
    kind: "github.list_repos",
    labelKey: "assistant.kindGithubRepos",
    fields: [],
  },
  {
    kind: "github.list_pulls",
    labelKey: "assistant.kindGithubPulls",
    fields: ["repoQuery"],
  },
  {
    kind: "github.list_commits",
    labelKey: "assistant.kindGithubCommits",
    fields: ["repoQuery"],
  },
  {
    kind: "github.list_branches",
    labelKey: "assistant.kindGithubBranches",
    fields: ["repoQuery"],
  },
  {
    kind: "github.open_panel",
    labelKey: "assistant.kindGithubOpenPanel",
    fields: [],
  },
  {
    kind: "github.open_repo",
    labelKey: "assistant.kindGithubOpenRepo",
    fields: ["repoQuery"],
  },
  {
    kind: "supabase.list_projects",
    labelKey: "assistant.kindSupabaseList",
    fields: [],
  },
  {
    kind: "supabase.studio",
    labelKey: "assistant.kindSupabaseStudio",
    fields: ["query"],
  },
  {
    kind: "supabase.studio_stop",
    labelKey: "assistant.kindSupabaseStudioStop",
    fields: [],
  },
  {
    kind: "terminal.open",
    labelKey: "assistant.kindTerminalOpen",
    fields: ["folder"],
  },
  {
    kind: "files.goto",
    labelKey: "assistant.kindFilesGoto",
    fields: ["folder"],
  },
  {
    kind: "files.find",
    labelKey: "assistant.kindFilesFind",
    fields: ["query", "folder"],
  },
  {
    kind: "files.open",
    labelKey: "assistant.kindFilesOpen",
    fields: ["query"],
  },
  { kind: "refuse.write", labelKey: "assistant.kindRefuseWrite", fields: [] },
] as const;
