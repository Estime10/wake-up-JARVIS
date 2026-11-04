import "server-only";

import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { formatSupabaseProjectsReply } from "@/features/assistant/model/formatSupabaseProjectsReply";
import { t } from "@/lib/i18n";
import { loadSupabasePlatformToken } from "@/lib/supabase/platform/connectionToken";
import { listSupabasePlatformProjects } from "@/lib/supabase/platform/managementApi";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export function isSupabaseIntent(
  intent: AssistantIntent,
): intent is Extract<
  AssistantIntent,
  { kind: "supabase.list_projects" | "supabase.studio" }
> {
  return (
    intent.kind === "supabase.list_projects" ||
    intent.kind === "supabase.studio"
  );
}

type ConnectionRow = {
  id: string;
  account_label: string;
  status: string;
};

type ProjectEntry = {
  accountLabel: string;
  name: string;
  ref: string;
  region?: string;
};

async function listAllProjects(): Promise<
  | { ok: true; entries: ProjectEntry[] }
  | { ok: false; reason: "auth" | "missing" | "config" }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "auth" };
  }

  const { data: rows, error } = await supabase
    .from("supabase_platform_connections")
    .select("id, account_label, status")
    .order("connected_at", { ascending: true });

  if (error) {
    return { ok: false, reason: "config" };
  }

  const connections = (rows ?? []) as ConnectionRow[];
  if (connections.length === 0) {
    return { ok: false, reason: "missing" };
  }

  const entries: ProjectEntry[] = [];

  for (const connection of connections) {
    if (connection.status === "needs_reauth") {
      continue;
    }
    const loaded = await loadSupabasePlatformToken(connection.id);
    if (!loaded.ok) {
      continue;
    }
    const projects = await listSupabasePlatformProjects(loaded.token);
    if (!projects.ok) {
      continue;
    }
    for (const project of projects.data) {
      entries.push({
        accountLabel: connection.account_label,
        name: project.name,
        ref: project.ref,
        ...(project.region ? { region: project.region } : {}),
      });
    }
  }

  return { ok: true, entries };
}

/**
 * Intents Supabase — liste projets multi-comptes ; Studio (texte + UI client).
 */
export async function executeSupabaseIntent(
  intent: Extract<
    AssistantIntent,
    { kind: "supabase.list_projects" | "supabase.studio" }
  >,
): Promise<string> {
  const listed = await listAllProjects();
  if (!listed.ok) {
    return t("assistant.supabaseNotConnected");
  }

  const listText = formatSupabaseProjectsReply(listed.entries);

  if (intent.kind === "supabase.list_projects") {
    return listText;
  }

  if (!intent.projectQuery) {
    return t("assistant.supabaseStudioAsk", { list: listText });
  }

  const query = intent.projectQuery.trim().toLowerCase();
  const match = listed.entries.find(
    (entry) =>
      entry.name.toLowerCase() === query ||
      entry.ref.toLowerCase() === query ||
      entry.name.toLowerCase().includes(query) ||
      entry.ref.toLowerCase().includes(query),
  );

  if (!match) {
    return t("assistant.supabaseStudioNotFound", {
      project: intent.projectQuery,
    });
  }

  return t("assistant.supabaseStudioLaunching", {
    project: match.name,
    account: match.accountLabel,
  });
}
