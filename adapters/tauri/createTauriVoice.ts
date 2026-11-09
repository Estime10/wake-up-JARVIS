import { createBrowserVoice } from "@/adapters/browser/createBrowserVoice";
import { createPiperVoice, withSpeakFallback } from "@/adapters/piper";
import { createTauriPiperTransport } from "@/adapters/tauri/createTauriPiperTransport";
import type { VoicePort } from "@/ports/voice-port";

/**
 * Voix shell — Piper via `invoke` Rust (loopback :5911) + repli speechSynthesis.
 * ADR 0012 / 0014 — pas de proxy Next depuis le WebView.
 */
export function createTauriVoice(): VoicePort {
  return withSpeakFallback(
    createPiperVoice({ transport: createTauriPiperTransport() }),
    createBrowserVoice(),
  );
}
