import { invoke } from "@tauri-apps/api/core";

import type { PiperTransport } from "@/adapters/piper/types";

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function abortError(): DOMException {
  return new DOMException("Aborted", "AbortError");
}

/**
 * Transport shell — `voice_speak` → Piper `127.0.0.1:5911` (pas de fetch cross-origin).
 */
export function createTauriPiperTransport(): PiperTransport {
  return {
    async synthesize(text, signal) {
      if (signal.aborted) {
        throw abortError();
      }

      const speak = invoke<string>("voice_speak", { text });

      const wavBase64 = await new Promise<string>((resolve, reject) => {
        const onAbort = () => {
          void invoke("voice_stop").catch(() => {
            /* best-effort */
          });
          reject(abortError());
        };
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener("abort", onAbort, { once: true });
        speak
          .then((value) => {
            signal.removeEventListener("abort", onAbort);
            resolve(value);
          })
          .catch((error: unknown) => {
            signal.removeEventListener("abort", onAbort);
            reject(error);
          });
      });

      if (signal.aborted) {
        throw abortError();
      }
      return base64ToArrayBuffer(wavBase64);
    },
  };
}
