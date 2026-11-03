import { createBrowserVoice } from "@/adapters/browser/createBrowserVoice";
import { createHttpLlm } from "@/adapters/http/createHttpLlm";
import { createHttpRepo } from "@/adapters/http/createHttpRepo";
import { createMockPorts } from "@/adapters/mock";
import {
  createPiperHttpTransport,
  createPiperVoice,
  withSpeakFallback,
} from "@/adapters/piper";
import {
  createSupabaseMail,
  createSupabaseMemory,
  createSupabaseProfile,
} from "@/adapters/supabase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import type { Ports } from "@/ports";
import type { VoicePort } from "@/ports/voice-port";

function createAppVoice(): VoicePort {
  const browser = createBrowserVoice();
  // Piper via proxy Next ; repli speechSynthesis si indisponible avant 1er son.
  if (process.env.NEXT_PUBLIC_PIPER_TTS === "0") {
    return browser;
  }
  return withSpeakFallback(
    createPiperVoice({ transport: createPiperHttpTransport() }),
    browser,
  );
}

/**
 * Branchement V0b : mocks de base ; Voice = Piper (+ repli navigateur) ;
 * Memory + Profile + Mail + Repo + Llm → live si env Supabase.
 * Seul `app/providers.tsx` appelle cette fabrique.
 */
export function createAppPorts(): Ports {
  const ports = createMockPorts();
  const withVoice: Ports = {
    ...ports,
    voice: createAppVoice(),
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
