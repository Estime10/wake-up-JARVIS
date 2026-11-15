import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type EnsureSelectedInput = {
  userId: string;
  connectionId: string;
  projectRef: string;
  projectName: string;
};

/**
 * Active le compte + fixe le projet cloud avant prepare/start Studio.
 */
export async function ensureSelectedPlatformProject(
  input: EnsureSelectedInput,
): Promise<{ ok: true } | { ok: false }> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc(
    "admin_supabase_platform_connection_select_project",
    {
      p_user_id: input.userId,
      p_connection_id: input.connectionId,
      p_project_ref: input.projectRef.trim(),
      p_project_name: input.projectName.trim(),
    },
  );
  if (error) {
    return { ok: false };
  }
  return { ok: true };
}
