/**
 * Intents déterministes JARVIS — catalogue extensible.
 * Match local = réponse rapide (pas de LLM).
 */
export type AssistantIntent =
  | { kind: "help" }
  | { kind: "mail.list_by_label"; label: string }
  | { kind: "mail.list_sent_by_label"; label: string }
  | { kind: "mail.list_flagged" }
  | { kind: "mail.list_recent" }
  | { kind: "mail.count" }
  | { kind: "github.status" }
  | { kind: "github.list_repos" }
  | { kind: "github.list_pulls"; repoQuery: string }
  | { kind: "github.list_commits"; repoQuery: string }
  | { kind: "github.list_branches"; repoQuery: string };
