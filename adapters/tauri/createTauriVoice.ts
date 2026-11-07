import { createBrowserVoice } from "@/adapters/browser/createBrowserVoice";
import type { VoicePort } from "@/ports/voice-port";

/**
 * Voix shell — stub étape 3.
 * Étape 5 : remplacé par invoke Rust → Piper `127.0.0.1:5911`.
 */
export function createTauriVoice(): VoicePort {
  return createBrowserVoice();
}
