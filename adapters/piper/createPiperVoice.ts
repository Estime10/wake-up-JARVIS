import { createMockVoice } from "@/adapters/mock/createMockVoice";
import type { PiperTransport } from "@/adapters/piper/types";
import {
  createWebAudioSink,
  type WebAudioSink,
} from "@/adapters/piper/webAudioSink";
import { normalizeFr } from "@/lib/voice/normalizeFr";
import { splitSentences } from "@/lib/voice/splitSentences";
import type { VoicePort } from "@/ports/voice-port";

type CreatePiperVoiceOptions = {
  transport: PiperTransport;
  sink?: WebAudioSink;
};

/**
 * Voix Piper — phrase par phrase, prefetch n+1, abort immédiat (CA-A3).
 */
export function createPiperVoice(options: CreatePiperVoiceOptions): VoicePort {
  const mock = createMockVoice();
  const sink = options.sink ?? createWebAudioSink();
  const { transport } = options;

  return {
    startListening: mock.startListening,
    onWakeWord: mock.onWakeWord,

    async speak(text, { onLevel, onStart }, signal) {
      const normalized = normalizeFr(text);
      const sentences = splitSentences(normalized);
      if (sentences.length === 0 || signal.aborted) {
        onLevel(0);
        return;
      }

      let firstStarted = false;
      let nextWav: Promise<ArrayBuffer> | null = transport.synthesize(
        sentences[0]!,
        signal,
      );

      try {
        for (let index = 0; index < sentences.length; index += 1) {
          if (signal.aborted) {
            break;
          }
          const wavPromise = nextWav;
          if (!wavPromise) {
            break;
          }
          const following = sentences[index + 1];
          nextWav = following ? transport.synthesize(following, signal) : null;

          const wav = await wavPromise;
          if (signal.aborted) {
            break;
          }

          await sink.playWav(
            wav,
            {
              onLevel,
              ...(firstStarted
                ? {}
                : {
                    onStart: () => {
                      firstStarted = true;
                      onStart?.();
                    },
                  }),
            },
            signal,
          );
        }
      } finally {
        onLevel(0);
      }

      if (!firstStarted && !signal.aborted) {
        throw new Error("piper_no_audio");
      }
    },
  };
}
