import type { RepoTab } from "@/features/home/model/repoTab";

/**
 * Intents déterministes E.L.S.A. — registre lecture seule.
 * Match local = catalogue v2 (+ Supabase / phrases perso).
 */
export type AssistantIntent =
  | { kind: "help" }
  | { kind: "chat.greeting" }
  | { kind: "chat.how_are_you" }
  | { kind: "chat.thanks" }
  | { kind: "mail.list_recent" }
  | { kind: "mail.overview" }
  | { kind: "mail.count"; label?: string }
  | { kind: "mail.list_by_label"; label: string }
  | { kind: "mail.list_sent" }
  | { kind: "mail.list_sent_by_label"; label: string }
  | { kind: "mail.list_flagged" }
  | { kind: "mail.unread" }
  | { kind: "mail.today" }
  | { kind: "mail.yesterday" }
  | { kind: "mail.count_unread" }
  | { kind: "mail.count_flagged" }
  | { kind: "mail.count_today" }
  | { kind: "mail.labels" }
  | { kind: "mail.accounts" }
  | { kind: "mail.account"; account: string }
  | { kind: "mail.unread_account"; account: string }
  | { kind: "mail.from"; text: string }
  | { kind: "mail.search"; text: string }
  | { kind: "github.status" }
  | { kind: "github.list_repos" }
  | { kind: "github.list_pulls"; repoQuery?: string }
  | { kind: "github.list_commits"; repoQuery?: string }
  | { kind: "github.list_branches"; repoQuery?: string }
  | { kind: "github.open_panel" }
  | { kind: "github.open_repo"; repoQuery: string }
  | { kind: "github.prs_closed"; repoQuery?: string }
  | { kind: "github.commit_last"; repoQuery?: string }
  | { kind: "github.files"; repoQuery: string }
  | { kind: "github.file_preview"; repoQuery: string; file: string }
  | { kind: "github.repo_info"; repoQuery: string }
  | { kind: "github.activity" }
  | { kind: "github.pr_detail"; repoQuery: string; n: number }
  | { kind: "supabase.list_projects" }
  | { kind: "supabase.studio"; projectQuery?: string }
  | { kind: "supabase.studio_stop" }
  | { kind: "terminal.open"; folder?: string }
  | { kind: "files.goto"; folder: string }
  | { kind: "files.find"; query: string; folder?: string }
  | { kind: "files.open"; query?: string; revealInFinder?: boolean }
  | { kind: "refuse.write"; topic?: string }
  | { kind: "ui.phrase_catalog" }
  | { kind: "ui.panel_mail" }
  | { kind: "ui.close_panel" }
  | { kind: "ui.repo_tab"; tab: RepoTab; repoQuery?: string }
  | { kind: "ui.stop_speaking" }
  | { kind: "ui.mute" }
  | { kind: "ui.unmute" }
  | { kind: "system.status" }
  | { kind: "geo.where" }
  /** Réponse texte locale catalogue v2 (chat/help/time…). */
  | { kind: "v2.local"; id: string; slots: Record<string, string> }
  /** Intent reconnu mais handler / port pas encore branché. */
  | { kind: "v2.stub"; id: string; slots: Record<string, string> };
