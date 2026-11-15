import "server-only";

import { execFile } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { promisify } from "node:util";

import { createLogger } from "@/lib/logger";
import { ensureStudioEmbedProxy } from "@/lib/supabase/platform/studioEmbedProxy";

const execFileAsync = promisify(execFile);
const log = createLogger("localStudio");

/** Next/GUI PATH souvent sans Homebrew — docker/psql/supabase introuvables sinon. */
const CLI_PATH_PREFIX =
  "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/Applications/Docker.app/Contents/Resources/bin";

function cliEnv(
  extra: Record<string, string | undefined> = {},
): NodeJS.ProcessEnv {
  return {
    ...process.env,
    ...extra,
    PATH: `${CLI_PATH_PREFIX}:${process.env.PATH ?? ""}`,
  };
}

function resolvePsqlBin(): string {
  for (const candidate of [
    "/opt/homebrew/bin/psql",
    "/usr/local/bin/psql",
    "psql",
  ]) {
    if (!candidate.includes("/")) {
      return candidate;
    }
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // next
    }
  }
  return "psql";
}

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
    await execFileAsync("docker", ["info"], {
      timeout: 15_000,
      env: cliEnv(),
    });
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
      await execFileAsync("open", ["-a", "Docker"], {
        timeout: 10_000,
        env: cliEnv(),
      });
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
      env: cliEnv(),
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

export type LocalStudioStopResult =
  | { ok: true; alreadyStopped: boolean }
  | { ok: false; reason: "disabled" | "supabase_stop_failed"; detail?: string };

/**
 * `supabase stop` dans le repo — no-op soft si déjà arrêté.
 */
export async function stopLocalSupabaseStudio(
  cwd: string,
): Promise<LocalStudioStopResult> {
  if (!localStudioAllowed()) {
    return { ok: false, reason: "disabled" };
  }

  const running =
    (await isLocalStudioReachable()) || (await isSupabaseStackRunning(cwd));
  if (!running) {
    return { ok: true, alreadyStopped: true };
  }

  try {
    await execFileAsync("npx", ["supabase", "stop"], {
      cwd,
      timeout: 120_000,
      env: cliEnv(),
    });
    return { ok: true, alreadyStopped: false };
  } catch (error) {
    const err = error as {
      message?: string;
      stderr?: string | Buffer;
      stdout?: string | Buffer;
    };
    const detail = String(err.stderr ?? err.stdout ?? err.message ?? "").slice(
      0,
      280,
    );
    if (
      !(await isLocalStudioReachable()) &&
      !(await isSupabaseStackRunning(cwd))
    ) {
      return { ok: true, alreadyStopped: false };
    }
    return { ok: false, reason: "supabase_stop_failed", detail };
  }
}

const SYNCED_REF_FILE = "jarvis-synced-ref";
const REMOTE_SCHEMA_FILE = "remote-schema.sql";
const WIPE_PUBLIC_FILE = "wipe-public.sql";
/** Fallback aligné `supabase/config.toml` [db] port = 54322. */
const LOCAL_DB_URL_FALLBACK =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/** Wipe public + extensions fréquentes absentes du local (trgm, gist uuid, …). */
const WIPE_PUBLIC_SQL = `CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
`;

type SyncEnv = NodeJS.ProcessEnv & { SUPABASE_ACCESS_TOKEN: string };

async function supabaseCli(
  cwd: string,
  args: string[],
  env: SyncEnv,
  timeoutMs: number,
): Promise<void> {
  await execFileAsync("npx", ["supabase", ...args], {
    cwd,
    timeout: timeoutMs,
    env: cliEnv(env),
  });
}

/**
 * `supabase db query` refuse les scripts multi-statements (prepared statement).
 * Apply via `psql` — seul chemin fiable pour dump/wipe.
 */
async function resolveLocalDbUrl(cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync(
      "npx",
      ["supabase", "status", "-o", "env"],
      { cwd, timeout: 30_000, env: cliEnv() },
    );
    const match = stdout.match(/^DB_URL="([^"]+)"/m);
    const url = match?.[1]?.trim();
    if (url && url.length > 0) {
      return url;
    }
  } catch {
    // fallback config.toml
  }
  return LOCAL_DB_URL_FALLBACK;
}

async function psqlApplyFile(
  dbUrl: string,
  filePath: string,
  stopOnError: boolean,
): Promise<void> {
  const args = [dbUrl, "-f", filePath];
  if (stopOnError) {
    args.splice(1, 0, "-v", "ON_ERROR_STOP=1");
  }
  await execFileAsync(resolvePsqlBin(), args, {
    timeout: 180_000,
    env: cliEnv(),
  });
}

async function publicTableCount(dbUrl: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(
      resolvePsqlBin(),
      [
        dbUrl,
        "-tA",
        "-c",
        "SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';",
      ],
      { timeout: 15_000, env: cliEnv() },
    );
    const n = Number.parseInt(stdout.trim(), 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/**
 * Lie le CLI local au project_ref cloud (sans toucher la DB prod).
 */
export async function linkLocalSupabaseProject(
  cwd: string,
  projectRef: string,
  accessToken: string,
): Promise<{ ok: true } | { ok: false; reason: "link_failed" }> {
  const ref = projectRef.trim();
  const token = accessToken.trim();
  if (ref.length === 0 || token.length === 0) {
    return { ok: false, reason: "link_failed" };
  }

  try {
    const { mkdir, writeFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const tempDir = join(cwd, "supabase", ".temp");
    await mkdir(tempDir, { recursive: true });
    await writeFile(join(tempDir, "project-ref"), ref, "utf8");

    try {
      await supabaseCli(
        cwd,
        ["link", "--project-ref", ref, "--yes"],
        { ...process.env, SUPABASE_ACCESS_TOKEN: token },
        60_000,
      );
    } catch {
      // project-ref posé — dump pourra encore fonctionner.
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "link_failed" };
  }
}

/**
 * Miroir local du schéma `public` du projet cloud sélectionné.
 * Docker/start doivent déjà être OK. Skip si déjà sync sur ce ref.
 */
export async function syncLocalSchemaFromCloud(
  cwd: string,
  projectRef: string,
  accessToken: string,
): Promise<
  | { ok: true; skipped: boolean }
  | { ok: false; reason: "link_failed" | "pull_failed" | "sync_failed" }
> {
  const ref = projectRef.trim();
  const token = accessToken.trim();
  if (ref.length === 0 || token.length === 0) {
    return { ok: false, reason: "link_failed" };
  }

  const { mkdir, readFile, writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const tempDir = join(cwd, "supabase", ".temp");
  await mkdir(tempDir, { recursive: true });

  try {
    const current = (
      await readFile(join(tempDir, SYNCED_REF_FILE), "utf8")
    ).trim();
    if (current === ref) {
      return { ok: true, skipped: true };
    }
  } catch {
    // pas encore sync
  }

  const linked = await linkLocalSupabaseProject(cwd, ref, token);
  if (!linked.ok) {
    return linked;
  }

  const env: SyncEnv = { ...process.env, SUPABASE_ACCESS_TOKEN: token };
  const schemaPath = join(tempDir, REMOTE_SCHEMA_FILE);

  try {
    // Dump remote — ne dépend pas de Docker local.
    await supabaseCli(
      cwd,
      ["db", "dump", "--linked", "--yes", "-s", "public", "-f", schemaPath],
      env,
      180_000,
    );
  } catch {
    return { ok: false, reason: "pull_failed" };
  }

  // Apply local — exige Docker + `supabase start` (appelant doit avoir starté).
  if (
    !(await isLocalStudioReachable()) &&
    !(await isSupabaseStackRunning(cwd))
  ) {
    return { ok: false, reason: "sync_failed" };
  }

  try {
    const wipePath = join(tempDir, WIPE_PUBLIC_FILE);
    await writeFile(wipePath, WIPE_PUBLIC_SQL, "utf8");
    const dbUrl = await resolveLocalDbUrl(cwd);
    await psqlApplyFile(dbUrl, wipePath, true);

    try {
      await psqlApplyFile(dbUrl, schemaPath, true);
    } catch (strictError) {
      // Indexes / EXCLUDE exotiques : apply best-effort puis vérifier les tables.
      const detail = String(
        (strictError as { stderr?: string | Buffer; message?: string })
          .stderr ??
          (strictError as { message?: string }).message ??
          "",
      ).slice(0, 400);
      log.error("sync_apply_strict_failed_retry_soft", { detail });
      await psqlApplyFile(dbUrl, wipePath, true);
      await psqlApplyFile(dbUrl, schemaPath, false);
      const tables = await publicTableCount(dbUrl);
      if (tables === 0) {
        return { ok: false, reason: "sync_failed" };
      }
      log.error("sync_apply_partial_ok", { tables, projectRef: ref });
    }

    await writeFile(join(tempDir, SYNCED_REF_FILE), ref, "utf8");
    return { ok: true, skipped: false };
  } catch (error) {
    const err = error as { stderr?: string | Buffer; message?: string };
    const detail = String(err.stderr ?? err.message ?? "").slice(0, 500);
    if (detail.length > 0) {
      log.error("sync_apply_failed", { detail });
    }
    return { ok: false, reason: "sync_failed" };
  }
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
      env: cliEnv(),
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
