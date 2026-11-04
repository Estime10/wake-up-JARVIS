import { z } from "zod";

const githubNameSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_.-]+$/, "github_name");

const segmentSchema = z
  .string()
  .min(1)
  .refine((value) => value !== "." && value !== "..", "path_segment");

/** owner / repo GitHub — refuse segments dangereux. */
export const githubOwnerRepoSchema = z.object({
  owner: githubNameSchema,
  repo: githubNameSchema,
});

/**
 * Ref ou chemin : pas de `.` / `..` comme segment.
 * Path peut être multi-segments séparés par `/`.
 */
export function parseGithubRef(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 256) {
    return null;
  }
  const segments = trimmed.split("/");
  for (const segment of segments) {
    if (!segmentSchema.safeParse(segment).success) {
      return null;
    }
  }
  return trimmed;
}

export function parseGithubPath(raw: string): string | null {
  return parseGithubRef(raw);
}

/** Vérifie que le path URL final reste sous `/repos/{owner}/{repo}/`. */
export function assertGithubReposUrl(
  urlPathname: string,
  owner: string,
  repo: string,
): boolean {
  const expectedPrefix = `/repos/${owner}/${repo}/`;
  const normalized = urlPathname.replace(/\/+/g, "/");
  return (
    normalized === `/repos/${owner}/${repo}` ||
    normalized.startsWith(expectedPrefix)
  );
}
