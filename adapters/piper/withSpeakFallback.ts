import type { VoicePort } from "@/ports/voice-port";

type Speak = VoicePort["speak"];

/**
 * Tente `primary` ; si échec **avant** le premier audio, bascule sur `fallback`.
 * Après `onStart` de primary, plus de repli (CA-A2).
 */
export function withSpeakFallback(
  primary: VoicePort,
  fallback: VoicePort,
): VoicePort {
  return {
    startListening: primary.startListening.bind(primary),
    onWakeWord: primary.onWakeWord.bind(primary),

    async speak(text, handlers, signal) {
      let started = false;
      const wrapped: Parameters<Speak>[1] = {
        onLevel: handlers.onLevel,
        onStart: () => {
          started = true;
          handlers.onStart?.();
        },
      };

      try {
        await primary.speak(text, wrapped, signal);
      } catch (error) {
        if (signal.aborted || started) {
          throw error;
        }
        await fallback.speak(text, handlers, signal);
      }
    },
  };
}
