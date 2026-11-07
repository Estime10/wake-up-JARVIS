import { createBrowserVoice } from "@/adapters/browser/createBrowserVoice";
import { createHttpLlm } from "@/adapters/http/createHttpLlm";
import { createHttpRepo } from "@/adapters/http/createHttpRepo";
import { createMockPorts } from "@/adapters/mock";
import {
  createPiperHttpTransport,
  createPiperVoice,
  withSpeakFallback,
} from "@/adapters/piper";
import { createTauriVoice } from "@/adapters/tauri/createTauriVoice";
import {
  createSupabaseMail,
  createSupabaseMemory,
  createSupabaseProfile,
} from "@/adapters/supabase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { isTauri } from "@/lib/runtime/isTauri";
import { isVoiceMuted } from "@/lib/voice/voiceMute";
import type { Ports } from "@/ports";
import type { VoicePort } from "@/ports/voice-port";

function withVoiceMute(voice: VoicePort): VoicePort {
  return {
    ...voice,
    async speak(text, handlers, signal) {
      if (isVoiceMuted()) {
        return;
      }
      await voice.speak(text, handlers, signal);
    },
  };
}

function createAppVoice(): VoicePort {
  // Shell : pas de proxy Next/Piper HTTP (prod Vercel) — stub jusqu’à l’étape 5.
  if (isTauri()) {
    return withVoiceMute(createTauriVoice());
  }

  const browser = createBrowserVoice();
  const base =
    process.env.NEXT_PUBLIC_PIPER_TTS === "0"
      ? browser
      : withSpeakFallback(
          createPiperVoice({ transport: createPiperHttpTransport() }),
          browser,
        );
  return withVoiceMute(base);
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
