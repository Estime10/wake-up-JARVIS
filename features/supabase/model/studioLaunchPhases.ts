import type { StudioLaunchPhase } from "@/features/home/tauri/studioEnsure";
import type { MessageKey } from "@/lib/i18n/types";

/** Libellé bouton / statut UI pendant le lancement. */
export const STUDIO_PHASE_UI_KEYS: Record<StudioLaunchPhase, MessageKey> = {
  docker: "home.supabaseStudioPhaseDocker",
  docker_ready: "home.supabaseStudioPhaseDockerReady",
  stack: "home.supabaseStudioPhaseStack",
  stack_ready: "home.supabaseStudioPhaseStackReady",
  sync: "home.supabaseStudioPhaseSync",
  sync_done: "home.supabaseStudioPhaseSyncDone",
  browser: "home.supabaseStudioPhaseBrowser",
  done: "home.supabaseStudioPhaseDone",
};

/** Phrase ELSA (voix) — une annonce claire par étape. */
export const STUDIO_PHASE_SPEAK_KEYS: Partial<
  Record<StudioLaunchPhase, MessageKey>
> = {
  docker: "home.supabaseStudioSpeakDocker",
  docker_ready: "home.supabaseStudioSpeakDockerReady",
  stack: "home.supabaseStudioSpeakStack",
  stack_ready: "home.supabaseStudioSpeakStackReady",
  sync: "home.supabaseStudioSpeakSync",
  sync_done: "home.supabaseStudioSpeakSyncDone",
  browser: "home.supabaseStudioSpeakBrowser",
};
