import "server-only";

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { ensureStudioEmbedProxy } from "@/lib/supabase/platform/studioEmbedProxy";

const execFileAsync = promisify(execFile);

export type DockerEnsureResult =
  | { ok: true; startedDocker: boolean; alreadyRunning: boolean }
  | {
      ok: false;
      reason: "disabled" | "docker_missing" | "docker_start_failed";
    };

export type LocalStudioStartResult =
  | {
      ok: true;
      studioUrl: string;
      embedUrl: string;
      startedDocker: boolean;
      alreadyRunning: boolean;
    }
  | {
      ok: false;
      reason:
        | "disabled"
        | "docker_missing"
        | "docker_start_failed"
        | "supabase_start_failed"
        | "port_in_use";
      detail?: string;
    };

/** URL Studio brute (navigateur). L’iframe utilise le proxy embed. */
const STUDIO_URL = "http://127.0.0.1:54323";
const DOCKER_WAIT_MS = 90_000;
const DOCKER_POLL_MS = 2_000;

async function successResult(
  startedDocker: boolean,
  alreadyRunning: boolean,
): Promise<Extract<LocalStudioStartResult, { ok: true }>> {
  const embed = await ensureStudioEmbedProxy();
  return {
    ok: true,
    studioUrl: STUDIO_URL,
    embedUrl: embed.embedUrl,
    startedDocker,
    alreadyRunning,
  };
}

function localStudioAllowed(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_LOCAL_STUDIO === "1"
  );
}

async function dockerInfoOk(): Promise<boolean> {
  try {
    await execFileAsync("docker", ["info"], { timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Vérifie Docker ; sur macOS lance Docker Desktop si besoin, puis attend.
 */
export async function ensureDockerRunning(): Promise<DockerEnsureResult> {
  if (!localStudioAllowed()) {
    return { ok: false, reason: "disabled" };
  }

  if (await dockerInfoOk()) {
    return { ok: true, startedDocker: false, alreadyRunning: true };
  }

  if (process.platform === "darwin") {
    try {
      await execFileAsync("open", ["-a", "Docker"], { timeout: 10_000 });
    } catch {
      return { ok: false, reason: "docker_missing" };
    }
  } else {
    return { ok: false, reason: "docker_missing" };
  }

  const deadline = Date.now() + DOCKER_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => {
      setTimeout(resolve, DOCKER_POLL_MS);
    });
    if (await dockerInfoOk()) {
      return { ok: true, startedDocker: true, alreadyRunning: false };
    }
  }

  return { ok: false, reason: "docker_start_failed" };
}

/** Studio joignable sur :54323 ? */
export async function isLocalStudioReachable(): Promise<boolean> {
  try {
    const response = await fetch(STUDIO_URL, {
      method: "GET",
      signal: AbortSignal.timeout(3_000),
    });
    return response.ok || response.status === 304 || response.status === 404;
  } catch {
    return false;
  }
}

/**
 * `supabase status` OK → stack déjà up.
 */
async function isSupabaseStackRunning(cwd: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("npx", ["supabase", "status"], {
      cwd,
      timeout: 30_000,
      env: process.env,
    });
    return /API URL|studio/i.test(stdout) || /54331|54323/.test(stdout);
  } catch {
    return false;
  }
}

function classifyStartError(
  stderr: string,
  stdout: string,
): {
  reason: "port_in_use" | "supabase_start_failed";
  /** Log serveur uniquement — jamais renvoyé au client (DEV-13). */
  logDetail: string;
} {
  const text = `${stderr}\n${stdout}`;
  if (
    /address already in use|ports are not available|bind: address/i.test(text)
  ) {
    return {
      reason: "port_in_use",
      logDetail: text.slice(0, 280),
    };
  }
  return {
    reason: "supabase_start_failed",
    logDetail: text.slice(0, 280) || "unknown",
  };
}

/**
 * Démarre Docker si besoin, puis `supabase start` dans le repo.
 * Si la stack / Studio tourne déjà → succès (pas d’erreur).
 */
export async function startLocalSupabaseStudio(
  cwd: string,
): Promise<LocalStudioStartResult> {
  const docker = await ensureDockerRunning();
  if (!docker.ok) {
    return { ok: false, reason: docker.reason };
  }

  if ((await isLocalStudioReachable()) || (await isSupabaseStackRunning(cwd))) {
    return await successResult(docker.startedDocker, true);
  }

  try {
    await execFileAsync("npx", ["supabase", "start"], {
      cwd,
      timeout: 180_000,
      env: process.env,
    });
    return await successResult(docker.startedDocker, false);
  } catch (error) {
    const err = error as {
      message?: string;
      stderr?: string | Buffer;
      stdout?: string | Buffer;
    };
    const stderr = String(err.stderr ?? "");
    const stdout = String(err.stdout ?? err.message ?? "");
    const classified = classifyStartError(stderr, stdout);

    // Port pris mais Studio déjà joignable → on considère OK.
    if (
      classified.reason === "port_in_use" &&
      (await isLocalStudioReachable())
    ) {
      return await successResult(docker.startedDocker, true);
    }

    return {
      ok: false,
      reason: classified.reason,
      detail: classified.logDetail,
    };
  }
}
