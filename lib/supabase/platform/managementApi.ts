import "server-only";

import { z } from "zod";

const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  ref: z.string().min(1),
  organization_id: z.string().optional(),
  region: z.string().optional(),
});

export type SupabasePlatformProject = z.infer<typeof projectSchema>;

export type ManagementApiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      reason: "unauthorized" | "forbidden" | "upstream" | "invalid";
    };

/**
 * Liste les projets cloud — valide aussi le access token.
 * https://api.supabase.com/v1/projects
 */
export async function listSupabasePlatformProjects(
  token: string,
): Promise<ManagementApiResult<SupabasePlatformProject[]>> {
  try {
    const response = await fetch("https://api.supabase.com/v1/projects", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      return { ok: false, reason: "unauthorized" };
    }
    if (response.status === 403) {
      return { ok: false, reason: "forbidden" };
    }
    if (!response.ok) {
      return { ok: false, reason: "upstream" };
    }

    const json: unknown = await response.json();
    const parsed = z.array(projectSchema).safeParse(json);
    if (!parsed.success) {
      return { ok: false, reason: "invalid" };
    }

    return { ok: true, data: parsed.data };
  } catch {
    return { ok: false, reason: "upstream" };
  }
}
