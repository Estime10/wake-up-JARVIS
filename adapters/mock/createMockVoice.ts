import { delay, isAbortError } from "@/adapters/mock/delay";
import { MOCK_LISTEN_DRAFT } from "@/fixtures/listenDraft";
import type { VoicePort } from "@/ports/voice-port";

const LEVEL_HZ = 30;
const TRANSCRIPT_MS = 180;

/** Niveau factice (sinus + bruit) — jamais en state React. */
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

/** Mock voix — transcription + niveaux ; speak sans audio. */
export function createMockVoice(): VoicePort {
  return {
    startListening({ onTranscript, onLevel }) {
      let stopped = false;
      const stopLevel = startLevelPump(onLevel);
      const transcriptId = window.setTimeout(() => {
        if (!stopped) {
          onTranscript(MOCK_LISTEN_DRAFT);
        }
      }, TRANSCRIPT_MS);

      return {
        stop() {
          stopped = true;
          window.clearTimeout(transcriptId);
          stopLevel();
          onLevel(0);
        },
      };
    },

    async speak(text, { onLevel }, signal) {
      const stopLevel = startLevelPump(onLevel);
      try {
        // ~28 ms / caractère, borné pour les longs textes.
        const ms = Math.min(4000, Math.max(400, text.length * 28));
        await delay(ms, signal);
      } catch (error) {
        if (!isAbortError(error)) {
          throw error;
        }
      } finally {
        stopLevel();
        onLevel(0);
      }
    },

    onWakeWord(handler) {
      // Détection réelle plus tard (openWakeWord). Mock : no-op.
      void handler;
      return () => {};
    },
  };
}
