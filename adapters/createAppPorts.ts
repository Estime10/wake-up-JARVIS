import { createMockPorts } from "@/adapters/mock";
import { createSupabaseMemory } from "@/adapters/supabase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import type { Ports } from "@/ports";

/**
 * Branchement V0b : mocks partout, MemoryPort → Supabase si env présente.
 * Seul `app/providers.tsx` appelle cette fabrique.
 */
export function createAppPorts(): Ports {
  const ports = createMockPorts();

  if (!hasSupabasePublicEnv()) {
    return ports;
  }

  return {
    ...ports,
    memory: createSupabaseMemory(createSupabaseBrowserClient()),
  };
}
