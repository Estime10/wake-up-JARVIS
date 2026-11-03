import { decodeWavToAudioBuffer } from "@/adapters/piper/wav";

export type WebAudioSink = {
  playWav(
    wav: ArrayBuffer,
    handlers: {
      onStart?: () => void;
      onLevel: (level: number) => void;
    },
    signal: AbortSignal,
  ): Promise<void>;
  dispose(): void;
};

/**
 * Lecture WAV via Web Audio — niveau approximé, abort = stop immédiat.
 */
export function createWebAudioSink(): WebAudioSink {
  let ctx: AudioContext | null = null;
  let currentSource: AudioBufferSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let levelTimer: number | null = null;

  function ensureCtx(): AudioContext {
    if (!ctx) {
      ctx = new AudioContext();
    }
    return ctx;
  }

  function stopLevel(): void {
    if (levelTimer !== null) {
      window.clearInterval(levelTimer);
      levelTimer = null;
    }
  }

  function stopSource(): void {
    stopLevel();
    if (currentSource) {
      try {
        currentSource.stop();
      } catch {
        /* already stopped */
      }
      currentSource.disconnect();
      currentSource = null;
    }
    analyser?.disconnect();
    analyser = null;
  }

  return {
    async playWav(wav, { onStart, onLevel }, signal) {
      const audioCtx = ensureCtx();
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }

      stopSource();
      if (signal.aborted) {
        onLevel(0);
        return;
      }

      const buffer = await decodeWavToAudioBuffer(audioCtx, wav);
      if (signal.aborted) {
        onLevel(0);
        return;
      }

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      const anal = audioCtx.createAnalyser();
      anal.fftSize = 256;
      source.connect(anal);
      anal.connect(audioCtx.destination);
      currentSource = source;
      analyser = anal;

      const data = new Uint8Array(anal.frequencyBinCount);
      levelTimer = window.setInterval(() => {
        anal.getByteTimeDomainData(data);
        let sum = 0;
        for (const sample of data) {
          const v = (sample - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        onLevel(Math.min(1, rms * 4));
      }, 1000 / 30);

      await new Promise<void>((resolve, reject) => {
        const onAbort = () => {
          stopSource();
          onLevel(0);
          resolve();
        };
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
        source.onended = () => {
          signal.removeEventListener("abort", onAbort);
          stopLevel();
          currentSource = null;
          onLevel(0);
          resolve();
        };
        try {
          source.start(0);
          onStart?.();
        } catch (error) {
          signal.removeEventListener("abort", onAbort);
          stopSource();
          onLevel(0);
          reject(error);
        }
      });
    },

    dispose() {
      stopSource();
      if (ctx) {
        void ctx.close();
        ctx = null;
      }
    },
  };
}
