/**
 * Intents déterministes JARVIS — registre lecture seule.
 * Match local = phrases d’exemple (rapide, pas de LLM).
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
  | { kind: "github.status" }
  | { kind: "github.list_repos" }
  | { kind: "github.list_pulls"; repoQuery?: string }
  | { kind: "github.list_commits"; repoQuery?: string }
  | { kind: "github.list_branches"; repoQuery?: string }
  | { kind: "github.open_panel" }
  | { kind: "github.open_repo"; repoQuery: string }
  | { kind: "supabase.list_projects" }
  | { kind: "supabase.studio"; projectQuery?: string }
  | { kind: "supabase.studio_stop" }
  | { kind: "terminal.open"; folder?: string }
  | { kind: "files.goto"; folder: string }
  | { kind: "files.find"; query: string; folder?: string }
  | { kind: "files.open"; query?: string; revealInFinder?: boolean }
  | { kind: "refuse.write" };
