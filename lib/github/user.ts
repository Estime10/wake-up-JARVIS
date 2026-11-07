import "server-only";

import { z } from "zod";

import {
  assertFineGrainedPatShape,
  assertReadOnlyPatScopes,
} from "@/lib/github/assertReadOnlyPatScopes";
import { createLogger } from "@/lib/logger";

const log = createLogger("github");

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";

const githubUserSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
});

export type GithubUser = z.infer<typeof githubUserSchema>;

export type GithubUserResult =
  | { ok: true; user: GithubUser }
  | {
      ok: false;
      reason: "unauthorized" | "forbidden" | "upstream" | "scopes";
    };

/**
 * Valide un PAT via GET /user — lecture seule, aucun autre endpoint.
 * Revérifie les scopes à chaque appel (connexion + usage).
 * Le token ne doit jamais être loggé.
 */
export async function fetchGithubUser(
  token: string,
): Promise<GithubUserResult> {
  const trimmed = token.trim();
  const isFineGrained = assertFineGrainedPatShape(trimmed);

  let response: Response;
  try {
    response = await fetch(`${GITHUB_API}/user`, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${trimmed}`,
        "X-GitHub-Api-Version": API_VERSION,
        "User-Agent": "wake-up-JARVIS",
      },
      cache: "no-store",
    });
  } catch {
    log.error("github_user_network");
    return { ok: false, reason: "upstream" };
  }

  if (response.status === 401) {
    return { ok: false, reason: "unauthorized" };
  }
  if (response.status === 403) {
    return { ok: false, reason: "forbidden" };
  }
  if (!response.ok) {
    log.error("github_user_http", { status: response.status });
    return { ok: false, reason: "upstream" };
  }

  const scopesHeader = response.headers.get("x-oauth-scopes");

  if (isFineGrained) {
    // FG : pas de scopes OAuth classic ; si un header apparaît, allowlist stricte.
    if (
      scopesHeader &&
      scopesHeader.trim().length > 0 &&
      !assertReadOnlyPatScopes(trimmed, scopesHeader)
    ) {
      log.error("github_user_fg_scopes_denied");
      return { ok: false, reason: "scopes" };
    }
  } else if (!assertReadOnlyPatScopes(trimmed, scopesHeader)) {
    log.error("github_user_scopes_denied");
    return { ok: false, reason: "scopes" };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    log.error("github_user_json");
    return { ok: false, reason: "upstream" };
  }

  const parsed = githubUserSchema.safeParse(json);
  if (!parsed.success) {
    log.error("github_user_shape");
    return { ok: false, reason: "upstream" };
  }

  return { ok: true, user: parsed.data };
}
