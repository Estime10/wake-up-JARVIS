import { createHttpRepo } from "@/adapters/http/createHttpRepo";
import { createMockPorts } from "@/adapters/mock";
import {
  createSupabaseMail,
  createSupabaseMemory,
  createSupabaseProfile,
} from "@/adapters/supabase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import type { Ports } from "@/ports";

/**
 * Branchement V0b : mocks partout ; Memory + Profile + Mail + Repo → live si env.
 * Seul `app/providers.tsx` appelle cette fabrique.
 */
export function createAppPorts(): Ports {
  const ports = createMockPorts();

  if (!hasSupabasePublicEnv()) {
    return ports;
  }

  const client = createSupabaseBrowserClient();
  return {
    ...ports,
    memory: createSupabaseMemory(client),
    profile: createSupabaseProfile(client),
    mail: createSupabaseMail(client),
    repo: createHttpRepo(),
  };
}
