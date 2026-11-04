import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { launchSupabaseStudioForQuery } from "@/features/assistant/services/launchSupabaseStudioForQuery";
import { stopSupabaseStudio } from "@/features/assistant/services/stopSupabaseStudio";
import { normalizeIntentText } from "@/features/assistant/model/normalizeIntentText";
import { t } from "@/lib/i18n";

export type AssistantUiPorts = {
  openTerminal: () => void;
  openGithubPanel: () => void;
  focusGithubRepo: (query: string) => void;
  /** Après lancement Studio — synchronise l’état UI (embed URL). */
  onStudioLaunched: (embedUrl: string) => void;
  /** Ferme l’embed Studio (retour liste projets). */
  onStudioStopped: () => void;
};

export type AssistantUiPending = null | "supabase.studio";

export type AssistantUiIntentResult = {
  pending: AssistantUiPending;
  /** Intent effectif (ex. follow-up nom de projet Studio). */
  intent: AssistantIntent | null;
  /**
   * Réponse déjà résolue côté client (ex. Studio lancé) —
   * à afficher/dire sans re-passer par le parse LLM.
   */
  spokenReply?: string;
};

/**
 * Side-effects UI après parse intent (terminal, GitHub, Studio).
 * Retourne le pending mis à jour + éventuel intent effectif (follow-up projet).
 */
export async function applyAssistantUiIntent(args: {
  text: string;
  intent: AssistantIntent | null;
  pending: AssistantUiPending;
  ui: AssistantUiPorts;
}): Promise<AssistantUiIntentResult> {
  let intent = args.intent;
  const { text, ui, pending } = args;
  const trimmed = text.trim();

  /**
   * Après « Quel projet ? », le prochain message = nom de projet —
   * sauf aide / liste / refus / studio déjà qualifié.
   * Sinon un « salut » / intent chat vole le pending et répond « Ça va… ».
   */
  if (
    pending === "supabase.studio" &&
    normalizeIntentText(trimmed).length > 0
  ) {
    const keepAsIs =
      (intent?.kind === "supabase.studio" && Boolean(intent.projectQuery)) ||
      intent?.kind === "supabase.studio_stop" ||
      intent?.kind === "supabase.list_projects" ||
      intent?.kind === "help" ||
      intent?.kind === "refuse.write";
    if (!keepAsIs) {
      intent = { kind: "supabase.studio", projectQuery: trimmed };
    }
  }

  if (!intent) {
    return { pending, intent: null };
  }

  if (intent.kind === "terminal.open") {
    ui.openTerminal();
    return { pending: null, intent };
  }

  if (intent.kind === "github.open_panel") {
    ui.openGithubPanel();
    return { pending: null, intent };
  }

  if (intent.kind === "github.open_repo") {
    ui.focusGithubRepo(intent.repoQuery);
    return { pending: null, intent };
  }

  if (intent.kind === "supabase.studio_stop") {
    ui.onStudioStopped();
    const stopped = await stopSupabaseStudio();
    if (stopped.ok) {
      return {
        pending: null,
        intent,
        spokenReply: stopped.alreadyStopped
          ? t("assistant.supabaseStudioAlreadyStopped")
          : t("assistant.supabaseStudioStopped"),
      };
    }
    return {
      pending: null,
      intent,
      spokenReply: t("assistant.supabaseStudioStopFailed"),
    };
  }

  if (intent.kind === "supabase.studio") {
    if (!intent.projectQuery) {
      return { pending: "supabase.studio", intent };
    }
    const launched = await launchSupabaseStudioForQuery(intent.projectQuery);
    if (launched.ok && launched.studioUrl) {
      ui.onStudioLaunched(launched.studioUrl);
      return {
        pending: null,
        intent,
        spokenReply: t("assistant.supabaseStudioLaunching", {
          project: launched.projectName,
          account: launched.accountLabel,
        }),
      };
    }
    if (launched.reason === "not_found") {
      return {
        pending: null,
        intent,
        spokenReply: t("assistant.supabaseStudioNotFound", {
          project: intent.projectQuery,
        }),
      };
    }
    if (launched.reason === "not_connected") {
      return {
        pending: null,
        intent,
        spokenReply: t("assistant.supabaseNotConnected"),
      };
    }
    return {
      pending: null,
      intent,
      spokenReply: t("assistant.supabaseStudioFailed", {
        project: intent.projectQuery,
      }),
    };
  }

  return { pending: null, intent };
}
