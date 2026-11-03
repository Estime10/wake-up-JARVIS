import "server-only";

import {
  assertBodyByteLength,
  assertSameOrigin,
  getPiperUpstreamUrl,
  isPiperProxyEnabled,
} from "@/adapters/piper/piperProxyConfig";

export {
  assertBodyByteLength,
  assertSameOrigin,
  getPiperUpstreamUrl,
  isPiperProxyEnabled,
};

/**
 * Proxy serveur → Piper local `/synthesize` (JSON {text} → WAV).
 */
export async function proxyPiperSynthesize(
  text: string,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  const upstream = getPiperUpstreamUrl();
  const response = await fetch(`${upstream}/synthesize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) {
    throw new Error(`piper_upstream_${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0) {
    throw new Error("piper_empty_wav");
  }
  return buffer;
}
