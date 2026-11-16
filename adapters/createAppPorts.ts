import { createBrowserVoice } from "@/adapters/browser/createBrowserVoice";
import { createHttpLlm } from "@/adapters/http/createHttpLlm";
import { createHttpMusic } from "@/adapters/http/createHttpMusic";
import { createHttpRepo } from "@/adapters/http/createHttpRepo";
import { createMockPorts } from "@/adapters/mock/createMockPorts";
import { createPiperVoice } from "@/adapters/piper/createPiperVoice";
import { createPiperHttpTransport } from "@/adapters/piper/httpTransport";
import { withSpeakFallback } from "@/adapters/piper/withSpeakFallback";
import { createTauriMusic } from "@/adapters/tauri/createTauriMusic";
import { createTauriVoice } from "@/adapters/tauri/createTauriVoice";
import { createSupabaseMail } from "@/adapters/supabase/createSupabaseMail";
import { createSupabaseMemory } from "@/adapters/supabase/createSupabaseMemory";
import { createSupabaseProfile } from "@/adapters/supabase/createSupabaseProfile";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { isTauri } from "@/lib/runtime/isTauri";
import { isVoiceMuted } from "@/lib/voice/voiceMute";
import type { MusicPort } from "@/ports/music-port";
import type { Ports } from "@/ports/ports";
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
  // Shell : invoke → Piper loopback (ADR 0014) — pas de proxy Next / fetch :5911.
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
 * Music : tente toujours l’invoke Rust d’abord (shell), HTTP en fallback web.
 * Ne dépend pas d’un `isTauri()` figé au boot.
 */
function createAppMusic(): MusicPort {
  const tauri = createTauriMusic();
  const http = createHttpMusic();
  return {
    async getNowPlaying(signal) {
      if (isTauri()) {
        const local = await tauri.getNowPlaying(signal);
        if (local) {
          return local;
        }
      }
      return http.getNowPlaying(signal);
    },
    async transport(action, signal) {
      if (isTauri()) {
        const local = await tauri.transport(action, signal);
        if (local) {
          return local;
        }
      }
      return http.transport(action, signal);
    },
  };
}

/**
 * Branchement V0b : mocks de base ; Voice = Piper (+ repli navigateur) ;
 * Music = Tauri local ou HTTP ; Memory + Profile + Mail + Repo + Llm → live si env Supabase.
 * Seul `app/providers.tsx` appelle cette fabrique.
 */
export function createAppPorts(): Ports {
  const ports = createMockPorts();
  const withLive: Ports = {
    ...ports,
    voice: createAppVoice(),
    music: createAppMusic(),
  };

  if (!hasSupabasePublicEnv()) {
    return withLive;
  }

  const client = createSupabaseBrowserClient();
  return {
    ...withLive,
    llm: createHttpLlm(),
    memory: createSupabaseMemory(client),
    profile: createSupabaseProfile(client),
    mail: createSupabaseMail(client),
    repo: createHttpRepo(),
  };
}
