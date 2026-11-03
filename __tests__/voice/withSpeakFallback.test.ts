import { describe, expect, it, vi } from "vitest";

import { withSpeakFallback } from "@/adapters/piper/withSpeakFallback";
import type { VoicePort } from "@/ports/voice-port";

function stubVoice(speak: VoicePort["speak"]): VoicePort {
  return {
    startListening: () => ({ stop: () => {} }),
    onWakeWord: () => () => {},
    speak,
  };
}

describe("withSpeakFallback — CA-A2", () => {
  it("bascule sur le repli si primary échoue avant onStart", async () => {
    const fallbackSpeak = vi.fn(async () => undefined);
    const primary = stubVoice(async () => {
      throw new Error("piper_down");
    });
    const fallback = stubVoice(fallbackSpeak);
    const voice = withSpeakFallback(primary, fallback);
    const ac = new AbortController();
    await voice.speak("bonjour", { onLevel: () => {} }, ac.signal);
    expect(fallbackSpeak).toHaveBeenCalledOnce();
  });

  it("ne bascule pas si primary a déjà démarré l’audio", async () => {
    const fallbackSpeak = vi.fn(async () => undefined);
    const primary = stubVoice(async (_t, handlers) => {
      handlers.onStart?.();
      throw new Error("mid_stream");
    });
    const fallback = stubVoice(fallbackSpeak);
    const voice = withSpeakFallback(primary, fallback);
    const ac = new AbortController();
    await expect(
      voice.speak("bonjour", { onLevel: () => {} }, ac.signal),
    ).rejects.toThrow("mid_stream");
    expect(fallbackSpeak).not.toHaveBeenCalled();
  });
});
