import { delay, isAbortError } from "@/adapters/mock/delay";
import { createMockVoice } from "@/adapters/mock/createMockVoice";
import { prefetchSpeechVoices } from "@/lib/voice/prefetchVoices";
import {
  cancelBrowserSpeech,
  startWelcomeSpeak,
  waitForSpeechVoices,
  waitWelcomeSpeakEnd,
} from "@/lib/voice/welcomeSpeak";
import type { VoicePort } from "@/ports/voice-port";

const LEVEL_HZ = 30;

function mockLevel(t: number): number {
  const wave = 0.35 + 0.25 * Math.sin(t * 6.2) + 0.15 * Math.sin(t * 13.1);
  const noise = (Math.random() - 0.5) * 0.08;
  return Math.min(1, Math.max(0, wave + noise));
}

function startLevelPump(onLevel: (level: number) => void): () => void {
  const started = performance.now();
  const id = window.setInterval(() => {
    const t = (performance.now() - started) / 1000;
    onLevel(mockLevel(t));
  }, 1000 / LEVEL_HZ);
  return () => window.clearInterval(id);
}

/**
 * Voix navigateur — `speechSynthesis` (Thomas fr si dispo).
 */
export function createBrowserVoice(): VoicePort {
  const mock = createMockVoice();
  prefetchSpeechVoices();

  return {
    startListening: mock.startListening,
    onWakeWord: mock.onWakeWord,

    async speak(text, { onLevel, onStart }, signal) {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        const stopLevel = startLevelPump(onLevel);
        try {
          onStart?.();
          await delay(Math.min(4000, Math.max(400, text.length * 28)), signal);
        } catch (error) {
          if (!isAbortError(error)) {
            throw error;
          }
        } finally {
          stopLevel();
          onLevel(0);
        }
        return;
      }

      const stopLevel = startLevelPump(onLevel);
      const onAbort = () => {
        cancelBrowserSpeech();
      };

      try {
        if (signal.aborted) {
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });

        await waitForSpeechVoices();
        if (signal.aborted) {
          return;
        }

        startWelcomeSpeak(text, {
          recordWelcomePlayed: false,
          ...(onStart !== undefined ? { onStart } : {}),
        });
        await waitWelcomeSpeakEnd();
      } finally {
        signal.removeEventListener("abort", onAbort);
        stopLevel();
        onLevel(0);
      }
    },
  };
}
