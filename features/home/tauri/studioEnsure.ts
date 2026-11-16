import { invoke } from "@tauri-apps/api/core";

import { localStudioBrowserUrl } from "@/lib/supabase/platform/localStudioUrl";

export type StudioLaunchPhase =
  | "docker"
  | "docker_ready"
  | "stack"
  | "stack_ready"
  | "sync"
  | "sync_done"
  | "browser"
  | "done";

type StudioDockerOk = {
  startedDocker: boolean;
  alreadyRunning: boolean;
};

type StudioStackOk = {
  alreadyRunning: boolean;
  studioUrl: string;
};

type StudioSyncOk = {
  skipped: boolean;
  studioUrl: string;
  projectRef: string;
};

export type StudioEnsureOk = {
  studioUrl: string;
  alreadyRunning: boolean;
  startedDocker: boolean;
  projectRef?: string | null;
};

export type StudioEnsureInput = {
  projectRef: string;
  accessToken: string;
};

async function notifyPhase(
  onPhase: ((phase: StudioLaunchPhase) => void | Promise<void>) | undefined,
  phase: StudioLaunchPhase,
): Promise<void> {
  if (!onPhase) {
    return;
  }
  await onPhase(phase);
}

/**
 * Pipeline séquentiel Tauri : Docker → stack → sync schéma.
 * `onPhase` est attendu à chaque étape (UI + voix ELSA).
 */
export async function launchLocalStudioStaged(
  input: StudioEnsureInput,
  onPhase?: (phase: StudioLaunchPhase) => void | Promise<void>,
): Promise<StudioEnsureOk> {
  await notifyPhase(onPhase, "docker");
  const docker = await invoke<StudioDockerOk>("studio_docker_ensure");
  await notifyPhase(onPhase, "docker_ready");

  await notifyPhase(onPhase, "stack");
  const stack = await invoke<StudioStackOk>("studio_stack_ensure");
  await notifyPhase(onPhase, "stack_ready");

  await notifyPhase(onPhase, "sync");
  const synced = await invoke<StudioSyncOk>("studio_schema_sync", {
    args: {
      projectRef: input.projectRef,
      accessToken: input.accessToken,
    },
  });
  await notifyPhase(onPhase, "sync_done");

  return {
    studioUrl:
      synced.studioUrl ||
      stack.studioUrl ||
      localStudioBrowserUrl(input.projectRef),
    alreadyRunning: stack.alreadyRunning,
    startedDocker: docker.startedDocker,
    projectRef: synced.projectRef ?? input.projectRef,
  };
}
