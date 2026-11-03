import { createBrowserVoice } from "@/adapters/browser/createBrowserVoice";
import { createHttpLlm } from "@/adapters/http/createHttpLlm";
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
 * Branchement V0b : mocks de base ; Voice navigateur toujours ;
 * Memory + Profile + Mail + Repo + Llm → live si env Supabase.
 * Seul `app/providers.tsx` appelle cette fabrique.
 */
export function createAppPorts(): Ports {
  const ports = createMockPorts();
  const withVoice: Ports = {
    ...ports,
    voice: createBrowserVoice(),
  };

  if (!hasSupabasePublicEnv()) {
    return withVoice;
  }

  const client = createSupabaseBrowserClient();
  return {
    ...withVoice,
    llm: createHttpLlm(),
    memory: createSupabaseMemory(client),
    profile: createSupabaseProfile(client),
    mail: createSupabaseMail(client),
    repo: createHttpRepo(),
  };
}
