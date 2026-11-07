import type { AssistantIntent } from "@/features/assistant/model/assistantIntent";
import { formatV2LocalReply } from "@/features/assistant/model/formatV2Reply";
import { launchSupabaseStudioForQuery } from "@/features/assistant/services/launchSupabaseStudioForQuery";
import { stopSupabaseStudio } from "@/features/assistant/services/stopSupabaseStudio";
import { normalizeIntentText } from "@/features/assistant/model/normalizeIntentText";
import type { RepoTab } from "@/features/home/model/repoTab";
import { t } from "@/lib/i18n";
import { setVoiceMuted } from "@/lib/voice/voiceMute";

export type UiPanelId = "terminal" | "mail" | "repo";

export type AssistantUiPorts = {
  openTerminal: () => void;
  openGithubPanel: () => void;
  focusGithubRepo: (query: string) => void;
  openMailPanel: () => void;
  /** Ferme un panneau ciblé ou tous ; renvoie ceux qui étaient ouverts. */
  closePanels: (target?: UiPanelId | "all") => UiPanelId[];
  openPhraseCatalog: () => void;
  focusRepoTab: (tab: RepoTab, repoQuery?: string) => void;
  stopSpeaking: () => void;
  /** Après lancement Studio — synchronise l’état UI (embed URL). */
  onStudioLaunched: (embedUrl: string) => void;
  /** Ferme l’embed Studio (retour liste projets). */
  onStudioStopped: () => void;
};

function resolveCloseTarget(text: string): UiPanelId | "all" {
  const n = normalizeIntentText(text);
  if (/\b(terminal|console|shell|iterm)\b/.test(n)) {
    return "terminal";
  }
  if (/\b(mails?|e-?mails?|courrier)\b/.test(n)) {
    return "mail";
  }
  if (/\b(github|repos?|depots?)\b/.test(n)) {
    return "repo";
  }
  return "all";
}

function spokenCloseReply(closed: readonly UiPanelId[]): string {
  if (closed.length === 0) {
    return t("assistant.panelAlreadyClosed");
  }
  if (closed.length === 1) {
    const only = closed[0]!;
    if (only === "terminal") {
      return t("assistant.terminalClosed");
    }
    if (only === "mail") {
      return t("assistant.mailPanelClosed");
    }
    return t("assistant.githubPanelClosed");
  }
  return t("assistant.panelsClosed");
}

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

function readGeoPlace(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        resolve(`${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`);
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
    );
  });
}

/**
 * Side-effects UI après parse intent (terminal, GitHub, Studio, panneaux, voix).
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
    return {
      pending: null,
      intent,
      spokenReply: intent.folder
        ? t("assistant.terminalOpenFolder", { folder: intent.folder })
        : t("assistant.terminalOpen"),
    };
  }

  if (intent.kind === "github.open_panel") {
    ui.openGithubPanel();
    return {
      pending: null,
      intent,
      spokenReply: t("assistant.githubOpenPanel"),
    };
  }

  if (intent.kind === "github.open_repo") {
    ui.focusGithubRepo(intent.repoQuery);
    return {
      pending: null,
      intent,
      spokenReply: t("assistant.githubOpenRepo", { repo: intent.repoQuery }),
    };
  }

  if (intent.kind === "ui.phrase_catalog") {
    ui.openPhraseCatalog();
    return {
      pending: null,
      intent,
      spokenReply: formatV2LocalReply("ui.phrase_catalog"),
    };
  }

  if (intent.kind === "ui.panel_mail") {
    ui.openMailPanel();
    return {
      pending: null,
      intent,
      spokenReply: formatV2LocalReply("ui.panel_mail"),
    };
  }

  if (intent.kind === "ui.close_panel") {
    const target = resolveCloseTarget(trimmed);
    const closed = ui.closePanels(target);
    return {
      pending: null,
      intent,
      spokenReply: spokenCloseReply(closed),
    };
  }

  if (intent.kind === "ui.repo_tab") {
    ui.focusRepoTab(intent.tab, intent.repoQuery);
    const replyId =
      intent.tab === "pr"
        ? "ui.repo_tab_pr"
        : intent.tab === "commits"
          ? "ui.repo_tab_commits"
          : intent.tab === "files"
            ? "ui.repo_tab_files"
            : "ui.repo_tab_branches";
    return {
      pending: null,
      intent,
      spokenReply: formatV2LocalReply(
        replyId,
        intent.repoQuery ? { repo: intent.repoQuery } : {},
      ),
    };
  }

  if (intent.kind === "ui.stop_speaking") {
    ui.stopSpeaking();
    return { pending: null, intent, spokenReply: "" };
  }

  if (intent.kind === "ui.mute") {
    setVoiceMuted(true);
    ui.stopSpeaking();
    return {
      pending: null,
      intent,
      spokenReply: formatV2LocalReply("ui.mute"),
    };
  }

  if (intent.kind === "ui.unmute") {
    setVoiceMuted(false);
    return {
      pending: null,
      intent,
      spokenReply: formatV2LocalReply("ui.unmute"),
    };
  }

  if (intent.kind === "geo.where") {
    const place = await readGeoPlace();
    if (!place) {
      return {
        pending: null,
        intent,
        spokenReply: t("assistant.geoWhereDenied"),
      };
    }
    return {
      pending: null,
      intent,
      spokenReply: formatV2LocalReply("geo.where", { place }),
    };
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
    if (launched.ok) {
      if (launched.studioUrl) {
        ui.onStudioLaunched(launched.studioUrl);
      }
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
