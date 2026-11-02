import "server-only";

import { createLogger } from "@/lib/logger";
import {
  GITHUB_API_BASE,
  GITHUB_API_VERSION,
  GITHUB_USER_AGENT,
} from "@/lib/github/constants";

const log = createLogger("github.request");

export type GithubHttpError =
  | {
      ok: false;
      reason: "unauthorized" | "forbidden" | "not_found" | "upstream";
      status: number;
    }
  | { ok: true; response: Response };

/**
 * GET GitHub API — token jamais loggé.
 */
export async function githubGet(
  token: string,
  path: string,
  query?: Record<string, string | undefined>,
): Promise<GithubHttpError> {
  const url = new URL(`${GITHUB_API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value.length > 0) {
        url.searchParams.set(key, value);
      }
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        "User-Agent": GITHUB_USER_AGENT,
      },
      cache: "no-store",
    });
  } catch {
    log.error("network", { path });
    return { ok: false, reason: "upstream", status: 0 };
  }

  if (response.status === 401) {
    return { ok: false, reason: "unauthorized", status: 401 };
  }
  if (response.status === 403) {
    return { ok: false, reason: "forbidden", status: 403 };
  }
  if (response.status === 404) {
    return { ok: false, reason: "not_found", status: 404 };
  }
  if (!response.ok) {
    log.error("http", { path, status: response.status });
    return { ok: false, reason: "upstream", status: response.status };
  }

  return { ok: true, response };
}
